const urlModel = require('../models/urlModel');
const isUrlValid = require("url-validation");
const{isValidRequestBody,isValid}=require('../validator/validator')
const shortid = require("shortid");
const redis= require('redis')
const{ promisify }=require('util')


//1. Connect to the redis server
const redisClient = redis.createClient(
    13661,
    "redis-13661.c305.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("4wb4eYU6aMMz9cyOMLj45bFnGgos8TWa", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });
  
  
  
  //2. Prepare the functions for each command
  
  const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
  const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
  


//------------------------first api to generate url code----------------------------------------
const generateUrl = async function (req, res) {
    try {
  
    //destructuring
    const { longUrl } = req.body

    if (!isValidRequestBody(req.body)) {
        return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide long url' })
    }

    if (!isValid(longUrl)) {
        res.status(400).send({ status: false, message: `longUrl is required` })
        return
    }


    //check long url is valid or not-http is present or not
    if (!isUrlValid(longUrl)) {
        return res.status(400).send({ status: false, message: "longUrl is not valid, Please provide valid url" })

    }
   
        let myUrl = longUrl
        let cahcedUrlData = await GET_ASYNC(`${myUrl}`)
        if (cahcedUrlData) {

            const urlDetails = JSON.parse(cahcedUrlData)
            return res.status(200).send({ satus: true, data: urlDetails })
        }
        let url = await urlModel.findOne({ longUrl: myUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
        if (url) {
            res.status(200).send({ status: true, data: url })
        }
        else {
            const urlCode = shortid.generate()
            // const shortUrl = baseUrl + '/' + urlCode
            let shortUrl = `${req.protocol}://${req.headers.host}/` + urlCode
            let shortUrlInLowerCase = shortUrl.toLowerCase()
            

            url = {
                longUrl: longUrl,
                shortUrl: shortUrlInLowerCase,
                urlCode: urlCode,
            }

            const myShortUrl = await urlModel.create(url)
            await SET_ASYNC(`${longUrl}`,6000, JSON.stringify(url))
            res.status(201).send({ status: true, data: myShortUrl })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })

    }
}

//--------------------------GetApi-----------------------

const redirectToLongUrl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode
      
        //finding longUrl in cache through urlCode
        let cachedUrlData = await GET_ASYNC(`${urlCode}`)

        if (cachedUrlData) {
            const parseLongUrl = JSON.parse(cachedUrlData)

            return res.status(302).redirect(parseLongUrl.longUrl)
        }
        else {
            const findUrl = await urlModel.findOne({ urlCode: urlCode })
            if (!findUrl) {
                // return a not found 404 status
                return res.status(404).send({ status: false, msg: "No URL Found" })
            }
            else {
                // when valid we perform a redirect
                //setting or storing data  in cache
                await SET_ASYNC(`${urlCode}`,6000, JSON.stringify(findUrl))
                res.status(302).redirect(findUrl.longUrl)
            }
        }
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports={generateUrl,redirectToLongUrl}


