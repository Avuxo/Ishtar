#[macro_use]
extern crate serde_derive;
extern crate toml;

use std::net::{TcpListener, TcpStream};
use std::thread;
use std::path::{Path, PathBuf};

#[derive(Deserialize)]
struct Config {
    port: i64,
    peer_list: String
}

fn read_peer_list<'a>(path: String) -> Vec<&'a str> {
    vec!["192.168.1.1", "192.168.1.1"]
}

// parse home path out of strings to create a valid path.
// only valid if path[0] == '~'.
// TODO: There's gotta be a built in function for this... find it!
fn parse_filename(path: String) -> PathBuf {
    let mut new_path = PathBuf::new();
    // 0x7E is ~. Due to weird rust typing bullshit I can't just
    // use an in-line char like I might in C.
    if path.as_bytes()[0] == 0x7E {
        // this assumes there is a home dir and will panic if
        // you're on some bizarre system without this implemented.
        new_path.push(std::env::home_dir().unwrap().as_os_str().to_str().unwrap());
        new_path.push(&path[2..]);
    }
    new_path
}

// read the config file (by default: ~/.ishtar)
// TODO: decide on path location based on OS for windows support
fn read_config(path: String) -> Config{
    let clean_path = parse_filename(path);
    let toml_contents = std::fs::read_to_string(clean_path.as_path())
        .expect("Could not read file");

    let config: Config = toml::from_str(&toml_contents).unwrap();
    config
}

fn main() {
    const PORT: i32 = 4848;

    // bind the TCP server.
    let listener = TcpListener::bind("127.0.0.1:4848").unwrap();
    println!("Ishtar Daemon is listening on port {}", PORT);

    let config: Config = read_config("~/.ishtar".to_string());

    // listen on the port for TCP requests and then delegate them based on packet info.
    for stream in listener.incoming() {
        thread::spawn(|| {
            println!("!!");
        });
    }
}
