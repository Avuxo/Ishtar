pub mod server {
    
    use std::net::{TcpListener, TcpStream};

    /*
    Local TCP Server
     */
    
    // OP 0
    fn handle_upload(stream: TcpStream) {
    }

    // OP 1
    fn handle_download(stream: TcpStream) {
    }

    // OP 2
    fn handle_list(stream: TcpStream) {
    }
    
    // handle input streams
    // packet is defined as follows:
    // 2A 90 OP NN NN NN NN FF ... FF.N
    // ^  ^     ^         ^  ^        ^
    // \  /     \         /  \        /
    // header      size         name
    fn handle_packet(stream: &mut TcpStream) {
        
        // read the header
        
        // check the header
        
        // read the operation

        // check the operation and delegate work.
    }

    pub fn start_tcp_server(port: i64) {
        // bind the TCP server.
        let listener = TcpListener::bind("127.0.0.1:4848").unwrap();
        println!("Ishtar Daemon is listening on port {}", port as i32);
        // listen on the port for TCP requests and then delegate them based on packet info.
        for mut stream in listener.incoming() {
            // The server will block during requests to reduce memory footprint
            // on users providing files.
            handle_packet(&mut stream.unwrap());
        }
        
    }

    /*
    HTTP File Server.
     */

    pub fn start_http_server(port: i64) {
        
    }
}
