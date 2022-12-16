const {connect} = require("mongoose")
const express = require("express")
const route = require("./routes/route")
const app = express()
app.use(express.json())
connect("mongodb+srv://saquib:Saquib123@mohammadsaquib.f3sxbno.mongodb.net/url",
{ useNewUrlParser: true })
.then(() => console.log("MongoDB is connected"))
.catch(err => console.log(err))
app.use("/", route)
app.listen(3000, function(){
console.log("Express port is running on "+3000)})