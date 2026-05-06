const base64Url = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Ik5n4buNYyBUdXnhu4JuIELDuWkifQ";
const base64 = base64Url.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');

// Method 1
let result1 = "";
try {
  result1 = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
} catch(e) { result1 = "error1"; }

// Method 2
let result2 = "";
try {
  result2 = decodeURIComponent(escape(atob(base64)));
} catch(e) { result2 = "error2"; }

console.log("Method 1:", result1);
console.log("Method 2:", result2);
