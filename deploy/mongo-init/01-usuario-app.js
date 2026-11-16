// HARDENING: usuario de aplicacion con permisos minimos (solo readWrite en authdb).
// ms-auth NUNCA usa el usuario root de Mongo.
const user = process.env.MONGO_APP_USER || "authapp";
const pwd = process.env.MONGO_APP_PASSWORD;
if (!pwd) { throw new Error("MONGO_APP_PASSWORD no definido"); }
db.getSiblingDB("authdb").createUser({
  user: user,
  pwd: pwd,
  roles: [{ role: "readWrite", db: "authdb" }]
});
