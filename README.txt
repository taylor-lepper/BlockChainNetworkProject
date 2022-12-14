To connect to the 2nd server
    -run this command in bash terminal in project folder
    HTTP_PORT=3002 P2P_PORT=5002 PEERS=ws://localhost:5001 npm run dev

To connect to the 3rd server
    -run this command in bash terminal in project folder (notice extra peers and different ports)
    HTTP_PORT=3003 P2P_PORT=5003 PEERS=ws://localhost:5002,ws://localhost:5001 npm run dev


To connect to the 4th server
    -run this command in bash terminal in project folder (notice extra peers and different ports)
    HTTP_PORT=3004 P2P_PORT=5004 PEERS=ws://localhost:5003,ws://localhost:5002,ws://localhost:5001 npm run dev