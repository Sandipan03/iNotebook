const express= require('express');
const router = express.Router();
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const jwt=require('jsonwebtoken');
const JWT_SECRET= 'iambad';
const fetchuser= require('./middleware/fetchuser');
// Route 1: New User sign up
router.post('/createuser',[
    body('name','enter a valid name').isLength({min: 3, max:60}),
    body('email','enter a valid email').isEmail(),
    body('password','password must be at least 5 characters').isLength({min:5})
],async (req,res)=>{
    let success=false;
    const errors= validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    try {
    let user= await User.findOne({email: req.body.email});
    if (user){
        return res.status(400).json({success,error: "Sorry! A user with this email already exists"});
    }
   const salt= await bcrypt.genSalt(10);
   const secpass = await bcrypt.hash(req.body.password,salt);
    user= await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secpass
    })
const data= {
    user: {
        id: user.id
    }
}
success=true;
const authtoken = jwt.sign(data, JWT_SECRET);
    res.json({success,authtoken});
    } catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server Error");

    }
})

// Route 2: User login
router.post('/login',[
    body('email','Enter a valid email').isEmail(),
    body('password','Password cannot be empty').exists()
],async (req,res)=>{
    let success=false;
    const errors= validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {email,password}= req.body;
    
    try {
    let user= await User.findOne({email});
    if (!user){
        return res.status(400).json({error: "Please try to log in with correct credentials"});
    }
    const passcomp= await bcrypt.compare(password,user.password);
    if (!passcomp){
        return res.status(400).json({success,error: "Please try to log in with correct credentials"});
    }

    const data= {
        user: {
            id: user.id
        }
    }
    success=true;
    const authtoken = jwt.sign(data, JWT_SECRET);
        res.json({success,authtoken});
}catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server Error");

}

})
// Route 3: Get user details using auth token
router.post('/getuser', fetchuser,async (req,res)=> {
    try {
        const  userID= req.user.id;
        const user= await User.findById(userID).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
    res.status(500).send("Internal Server Error");
    }
    
})
module.exports= router