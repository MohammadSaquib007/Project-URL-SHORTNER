const router = require('express').Router();
const urlController = require('../controllers/urlController');
router.post('/url/shorten',urlController.generateUrl);
router.get('/:urlCode',urlController.redirectToLongUrl)
router.all('/*', function(req,res){return res.status(404).send({Status:false, Message:"Path not found"})})
module.exports = router;