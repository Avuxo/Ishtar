/*
 Ishtar distributed system daemon
 This was originally written in Rust, but due to time constraints
 it was ported to Node for easier HTTP library stuff (mostly all of
 the projet is HTTP requests).

 NOTE: PORT AND PORT + 1 must be available. 
*/

const fs      = require('fs'),
      net     = require('net'),
      request = require('request'),
      express = require('express'),
      toml    = require('toml'),
      path    = require('path'),
      expfup  = require('express-fileupload'),
      crypto  = require('crypto');

const PORT = parseInt(process.argv[2]);

// just eat the startup cost one time so that we don't have to do it later.
const config = toml.parse(fs.readFileSync(
    path.join(require('os').homedir(), ".ishtar")));
const peerList = fs.readFileSync(config.peer_list).toString().split("\n");
// JSON file for simple parsing. Can either be a file path or an IP.
// if an IP is returned, the work is delegated elsewhere.
const fileList = require(config.file_list);

/*
 Taken from: SO
*/
function shuffle(array) {
    for(let i = array.length; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[j], array[i]] = [array[j], array[i]];
    }
    return array;
}

// upload to nearby peers given the peer list.
// return is a block of data including the 4 hashes.
function upload(data) {
    // create a SHA256 hash
    const hash = data => {
        let h = crypto.createHash('sha256');
        return h.update(data, 'utf-8').digest('hex');
    };
    
    // get the length as a 4-byte integer.
    const len = data.readIntLE(3);
    // we want to split the file up to n/x peers where x
    // is a predefined constant (in this case 5).
    // we then want to send those file chunks out to
    // n/x peers.
    const peerCount = 5;
    let x = (peerList.length < peerCount) ? peerList.length : peerCount;
    const chunkSize = len / x;
    const chunks = [];

    if (len < 1) return;
    
    // split the file into chunks
    // (this is inefficient but I've only got 6 hours left.)
    let i = 0;
    while (i < len) {
        console.log('!!');
        // get full chunk
        if (i + chunkSize < len) chunks.push(data.slice(i, i += chunkSize));
        // get a partial chunk of the remaining data.
        else chunks.push(data.slice(i, i += (len - i)));
    }
    
    let hashes = [];
    let newPeerList = shuffle(peerList);
    for(let i =0; i < peerCount; i++) {
        if(!newPeerList[i]) continue;
        // form a POST request with the data
        console.log(chunks[i]);
        request.post({
            url: `http://${newPeerList[i]}`,
            formData: {
                file: {
                    value: chunks[i],
                    options: {
                        filename: hash(chunks[i])
                    }
                }
            }
        }, (err, res, body) => {
            if(err) throw err;
            // in a future implementation, maintain state here for who is getting
            // what to save time on requests. 
            hashes.push(hash(chunks[i]));
        });
    }
}

// download the file from nearby peers.
function download(data) {
    let checksum = data.slice(7);
    // for a future implementation
    // routes to files should be cached locally
    // so that redirects are entirely unnecessary.
    // This is one of the two reasons that redirects were chosen
    // over just straight up throughputting data through every node.
    for(let i in peerList) {
        request(`http://${peerList[i]}/list`, (err, res, body) => {
            if(err) throw err;
            if(body.includes(checksum)) {
                request(`http://${peerList[i]}/?hash=${checksum}`, (err, res, body) => {
                    fs.writeFileSync(`~/.ishtar.d/files/${checksum}`);
                });
                break;
            }
        });
    }
}

// list the checksums available on all nearby peers
function list(data) {
    for(let i in peerList) {
        if(!peerList[i]) continue;
        request(`http://${peerList[i]}/list`, (err, res, body) => {
            if(err) throw err;
            // fix the weird formatting from the lazy parsing.
            // given this is for human reading it isn't super necessary.
            console.log(body.replace('[', '').replace(']', ''));
        });
    }
}



const server = net.createServer();
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Ishtar http microservice listening on port ${PORT}`);
});

// the rust client will delegate all HTTP traffic over to here because
// frankly I do not have the time to write this part in Rust.
server.on('connection', sock => {
    // valid operations (byte 3)
    const operations = {
        UPLOAD: 0,
        DOWNLOAD: 1,
        LIST: 2
    };
    sock.on('data', data => {
        if(data[0] == 0x2A && data[1] == 0x89) {
            // operation byte
            switch(data[2]) {
            case operations.UPLOAD:
                upload(data);
                break;
            case operations.DOWNLOAD:
                upload(data);
                break;
            case operations.LIST:
                list(data);
                break;
            }
        }
    });
});

/* 
 Express http server
*/

const app = express();

// middleware // 
app.use(expfup()); // file upload middleware

// get the list of files this server knows about / has
app.get('/list', (req, res) => {
    // this will return an array formatted thing that needs to be parsed : /
    res.send(Object.keys(fileList));
});

// download a file chunk
app.get('/', (req, res) => {
    let hash = req.query.hash;
    console.log(req.query.hash);
    if(fileList[hash]) {
        // if it's an IP, send a redirection.
        if(fileList[hash][0] == 'i') {
            res.status(307).send(fileList[hash].slice(1));
        } else { // file paths start with f
            // honestly a pretty inefficient way to handle this.
            // it should be done with streams, but that's slightly more work
            // than I have time to do.
            res.status(200).send(fs.readFileSync(fileList[hash].slice(1)));
        }
    } else {
        res.sendStatus(404);
    }
});

// endpoint for chunk update.
app.post('/', (req, res) => {
    // if only md5 wasn't wank I could use it because it comes with it.
    // However, I can't sleep at night knowing I used md5 as a checksum,
    // so I'm out here spending extra time hashing it with sha256.
    let hash = crypto.createHash('sha256');
    let file = req.files.file;
    const MAX_FILE_SIZE = 1024;

    // delegate the work and store.
    if(file.size > MAX_FILE_SIZE) {
        upload(req.files.file.data);
    }

    hash = hash.update(file.data, 'utf-8').digest('hex');
    res.send(`File uploaded: ${hash}`);
});

app.listen(PORT+1);
