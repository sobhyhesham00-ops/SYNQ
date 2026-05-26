const obj = { name: undefined };
try {
  console.log(obj?.name.toLowerCase());
} catch(e) {
  console.error("error 1", e.message);
}
const obj2 = null;
try {
  console.log(obj2?.name.toLowerCase());
} catch(e) {
  console.error("error 2", e.message);
}
