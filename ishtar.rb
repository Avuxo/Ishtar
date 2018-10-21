#!usr/bin/env ruby
require 'socket'
require 'toml'

# It is assumed the ishtar-daemon is running on the same machine
HOST = "localhost"

# Write magic numbers 42 and 137 to socket provided
# Specify which operation is being performed
# Then write the size of the content, and finally the content
def write( socket, operation, arg = nil )
  socket.write( [ 42 ].pack( "C" ) ) # magic num
  socket.write( [ 137 ].pack( "C" ) ) # magic num
  socket.write( [ operation ].pack( "C" ) ) # op byte (0 | 1 | 2)
  if not arg.nil?
    socket.write( [ arg.length ].pack( "L" ) )
    socket.write( arg )
  end
end

def validateHeader( socket )
  # Ensure the packet recieved has the correct magic numbers
  if socket.read( 1 ).bytes[ 0 ] != 42 or socket.read( 1 ).bytes[ 0 ] != 137
    raise ArgumentError, "Invalid magic numbers!"
  else
    # Return the packet's operation
    return socket.read( 1 ).bytes[ 0 ]
  end
end

def main
  # Load TOML config file, MUST exist
  content = TOML.load_file( "~/.ishtar" )
  port = content[ 'port' ]

  # Attempt to secure a connection to the ishtar-daemon before proceeding
  begin
    socket = TCPSocket.new( HOST, port )
  rescue Errno::ECONNREFUSED, Errno::ETIMEDOUT
    puts "Connection failed! Please make sure ishtar-d is running"
    exit 1
  end
  # Take in the first argument and execute the corresponding method
  # Shift the input so only the arguments are left
  arg1 = ARGV.shift
  begin
    if arg1 == "list"
      # Send a fetch packet and get the response
      write( socket, 2 )

      # Read and print the checksums
      index = 0
      if validateHeader( socket ) == 2
	size = socket.read( 4 ).unpack( "V" )[ 0 ]
	socket.read( size ).bytes.each do |b|
	  index = index + 1
	  print( index % 16 == 0 ? b.chr + "\n" : b.chr )
	end
      else
	# Operation code 3 for rejected packet
	write( socket, 3 )
	raise ArgumentError, "Server returned an invalid operation!"
      end

    elsif arg1 == "upload" and ARGV.length > 0
      # The user may want to upload multiple files at once; Go through each one and upload what exists
      ARGV.each do |file|
	if File.file? file
	  # Write and verify with a success message
	  write( socket, 0, File.absolute_path( file ) )
	  puts ( validateHeader socket ) == 0 ? "Success" : "Error"
	else
	  puts file + " does not exist!"
	end
      end
    elsif arg1 == "download" and ARGV.length == 2
      # Write and verify with a success or error message
      write( socket, 1, ARGV[ 0 ] + ARGV[ 1 ] );
      puts ( validateHeader socket ) == 0  ? "Success" : "Error"
    else
      puts "Incorrect usage! 'ruby ishtar.rb <list|upload|download> ...'"
    end
  rescue ArgumentError => error
    puts error.message
  end

  socket.close
end

main
