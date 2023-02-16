'use strict'
// Please don't delete the 'use strict' line above

//1021_Lecture2
function greeting(name){
    return "Hello," + name + "!";
}

console.log(greeting("Alex"));
 // => "Hello, Alex!"
console.log(greeting("Beau"));
 // => "Hello, Beau!"


function helloMessage(name){
    return　`Hello, ${name}!`;
}

const name = "Beau";
const aa = helloMessage(name);

console.log(1100 === 99) ;// => false
console.log(62 !== 60) ;// => true
console.log("6" !== "six") ;// => true
console.log("5" == "five") ;// => false