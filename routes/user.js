const { Router, response } = require("express")
const userRouter = Router();
const {userModel, purchaseModel, courseModel} = require("../db")
const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");
const bcrypt = require("bcrypt");
const z = require("zod");
const { userMiddleware } = require("../middleware/user");


userRouter.post("/signup", async (req, res) => {
    const userBody = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(10),
        firstName: z.string().min(3).max(20),
        lastName: z.string().min(3).max(20)
    })
    const parseUserData = userBody.safeParse(req.body);
    if(!parseUserData.success) {
        res.json({
            message: "incorrect format",
            error: parseUserData.error
        })
        return
    }

    const { email, password, firstName, lastName } = req.body;

    const userHashedPass = await bcrypt.hash(password, 5);
    console.log(userHashedPass);

    await userModel.create({
        email: email,
        password: userHashedPass,
        firstName: firstName,
        lastName: lastName
    })
    res.json({
        message: "Signup Succeeded"
    })
})

userRouter.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({
        email: email
    })

    if (!user) {
        res.status(403).json({
            message: "User does not exist in our Database"
        })
        return
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(passwordMatch) {
        const token = jwt.sign({
            id: user._id
        }, JWT_USER_PASSWORD);

        res.json({
            token: token
        })
    } else {
        res.status(403).json({
            message: "incorrect Credentials"
        })
    }

})

userRouter.get("/purchases", userMiddleware, async(req, res) => {
    const userId = req.userId;

    const purchases = await purchaseModel.find({
        userId
    })

    const courseData = await courseModel.find({
        _id: { $in: purchases.map(x => x.courseId) }
    })
    res.json({
        purchases
    })
})

module.exports = {
    userRouter: userRouter
}