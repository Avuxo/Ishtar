# Ishtar
A collaborative fully distributed cloud storage system
<p align="center">
   <img src="https://github.com/avuxo/Ishtar/blob/master/ishtar.gif?raw=true" />
   <br><i>special thanks to Chris and Martin for the awesome <a href="https://en.wikipedia.org/wiki/Inanna">Ishtar</a>-inspired logo!</i>
</p>


## Why Ishtar?
In 2018, when you use a service like AWS S3 or DropBox, you're making one pretty big assumption: the host is trustworthy. Can we make this assumption anymore? It's time to take back your data.

Ishtar is a fully distributed, trust-free cloud storage system. When you stick your files onto the Ishtar network, you don't have to fear for their security, because it's automatically assumed that everyone else on the network is malicious, and every check is made to make sure that _your_ data remains _yours_.

## How does Ishtar work?
Ishtar functions on top of HTTP, simply using GET and POST, meaning that it'll function on just about every network. When you decide to upload a file onto the Ishtar network, it first gets signed with your private key and then distributed out in 5 chunks to other users on the Ishtar network. Furthermore, each user doesn't get fully their own chunk, there is a lot of overlap in who gets what to ensure data redundency in case one peer goes offline. If a DropBox server dies, you don't use access to your data. Why should you lose your data on Ishtar?

If the node you are attempting to send data to does not have enough space to store all of your files, they will instead delegate the space off to one of _their_ peers and will maintain where that data went. This results in a tree-like structure for distribution of large files.

As with bittorrent, when a new user wants to join the network, they use obtain initial tracking data -- This can be provided by either another user or by a centralized source (The former would be perferred, however the latter is an inevitability in sufficiently large systems; decentralized systems seem to have a knack for becoming centralized... _github_) More peers are gained as time is spent on the network and files are uploaded and received.

As the files are encrypted and then split up, users have no idea what their data is. Even if every single actor on the network teamed up against you, they would still need access to your private key in order to decrypt the file.

Ishtar itself is implemented as a UNIX daemon that runs in the background. It runs an HTTP server that can be configured to run on any specified port. In order to download or upload files, you need to have your webserver running (to avoid the BT 0% seeder problem).

### Assumptions made by Ishtar
- Every actor on the network is attempting malicious action
- nodes will go offline and will return at will and will take their data with them.
- data cannot be overwritten once it is on the network, it must be reuploaded.
- users will provide storage in exchange for storing their files on the network.
- you have basic security surrounding your private key.

### What incentive is there for users to provide storage to the Ishtar network?
Unlike with modern cryptocurrency-based systems, there is _no_ monetary incentive for being a part of the Ishtar network. Instead, there is a far simpler solution. For every Megabyte that you provide in storage, you get 1 megabyte of Ishtar cloud storage.

### What is Ishtar _not_
Ishtar is _not_ a file-sharing protocol for pirates. The system is not designed in any way to distribute files to other users, as that would require distributing your private key to another individual (which is breaking rules 1-n of OPSEC).