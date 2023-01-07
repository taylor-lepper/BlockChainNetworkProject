// let map = new Map();

// let id = "12412409134523045982aasdfasf";
// let url = "http://www.thing.com";
// map.set(id,url);

// console.log(map);

// const { spawn } = require('node:child_process');
// const bat = spawn('cmd.exe', ['/c', 'my.sh']);

// bat.stdout.on('data', (data) => {
//   console.log(data.toString());
// });

// bat.stderr.on('data', (data) => {
//   console.error(data.toString());
// });

// bat.on('exit', (code) => {
//   console.log(`Child exited with code ${code}`);
// });

// var exec = require('child_process').exec;
// var path = require('path')

// var parentDir = path.resolve(process.cwd(), 'shellScripts');

// exec('test.sh', {cwd: parentDir}, function (error, stdout, stderr) {
//   // if you also want to change current process working directory:
//   process.chdir(parentDir);
// });

// let thing = [0, 1, 2, 3, 4, 5, 6];
// console.log(thing.length);

// let reggy = new RegExp(/^0x[a-fA-F0-9]{40}$/g);
// let recipient = "edgar";
// let address = "0x31cf779555d64d19b5b084ec0d5cf0b57a691fac";

// console.log(reggy.test(recipient));
// console.log(reggy.test(address));
// console.log(address.length);

// let recipient = "0x1eec9da65e0dc1cd6294a48a9a86e5da44e8858d";
// let reg = /^0x[a-fA-F0-9]{40}$/;

// let regRecipient = reg.test(recipient);


// console.log(reg.test(recipient)); // true

// let date = new Date().toISOString();
// console.log(date);


// function addMicroSeconds(date){
//     let time = date.split(".");
//     // console.log(time);
    
    
//     let seconds = time[1].slice(0, -1);
//     // console.log(seconds);
    
//     seconds = +seconds + 300;
    
//     seconds += "Z";
//     // console.log(seconds);
    
//     let newTime = time[0] + "." + seconds;
//     // console.log(newTime);

//     console.log(newTime);
// }

// addMicroSeconds(date);
// let address = "0x0113aaa9e833c203c99cceaa262a8cd1eba05f68";
// let publicKeyCompressed = "0x02936436d0b8ac917b950605abcb966097e11185e7e6c3d1646f751e4c0ec61cd1";

// console.log(publicKeyCompressed.length);

// console.log(address.length);

// let privK = "0xdc24b1ffb09076ea87bf6945dc85b7c8f3e8dbae9c15c05126335f0928188f90";
// console.log(privK.length);

// let pubk = "0x04cb8895f67310aad88e3a0f4ec7f8783d1f11568dcf652137efc1c8b91023503a007882e92aca0c47c921f3d39c50d29aa454357d3dffa52d96556652be396519";
// console.log(pubk.length);

// let pubkC = "0x03cb8895f67310aad88e3a0f4ec7f8783d1f11568dcf652137efc1c8b91023503a";
// console.log(pubkC.length);


const date = new Date().toISOString();
const date2 = new Date().toISOString();

let date3 = new Date(date);
let date4 = new Date(date2);
    
    let result= date3-date4;
    if (result > 60e3) console.log(
        Math.floor(result / 60e3), 'minutes ago'
    );
    else console.log(
        Math.floor(result / 1e3), 'seconds ago'
    );








