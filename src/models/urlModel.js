const {Schema,model} = require('mongoose')
const URLSchema = new Schema({
    urlCode: {type: String,required: true,unique: true,trim: true,lowercase: true},
    longUrl: {type: String,required: true},
    shortUrl: {type: String,unique: true,required: true}
}, { timestamps: true })
module.exports = model('Url', URLSchema)