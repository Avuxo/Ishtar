extern crate reqwest;
extern crate rand;

pub mod request {
    use super::rand::{thread_rng, Rng};
    
    // get the checksums that a given file provides.
    // TODO: handle fail case for requesting file from peer.
    pub fn list_files_on_server(server: String) {
        let body = reqwest::get(&server).unwrap()
            .text().unwrap();
        println!("{:?}", body);
    }

    pub fn upload_file(file: Vec<u8>, peer_list: Vec<String>) {
        // number of peers the file will be split up for (n/x).
        const num_peers_per_file: usize = 5;
        let client = reqwest::Client::new();
        
        // shuffle the peer list
        let mut clone = peer_list.to_vec();
        thread_rng().shuffle(&mut clone);

        // loop through the peer list and send off to the first n/5 peers
        let n: usize = peer_list.len() / num_peers_per_file;

        // the number of bytes that need sending.
        let mut bytes_remaining = file.len();
        let bytes_per_peer = bytes_remaining / num_peers_per_file;
        let mut bytes_sent = 0;
        for peer in &clone[..n] {
            let body = &file[bytes_sent..(bytes_sent + bytes_per_peer)];
            let res = client.post(peer)
                .body(body)
                .send();
        }
    }
}
