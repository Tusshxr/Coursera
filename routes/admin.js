const { Router } = require("express")
const adminRouter = Router();
const {adminModel, courseModel} = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");
const bcrypt = require("bcrypt");
const z = require("zod");
const { adminMiddleware } = require("../middleware/admin");

adminRouter.post("/signup",async (req, res) => {
    const adminBody = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(10),
        firstName: z.string().min(3).max(20),
        lastName: z.string().min(3).max(20)
    })
    const parseAdminData = adminBody.safeParse(req.body);
    if(!parseAdminData.success) {
        res.json({
            message: "incorrect format",
            error: parseAdminData.error
        })
        return
    }

    const { email, password, firstName, lastName } = req.body;

    const adminHashedPass = await bcrypt.hash(password, 6);
    console.log(adminHashedPass);

    await adminModel.create({
        email: email,
        password: adminHashedPass,
        firstName: firstName,
        lastName: lastName
    })
    res.json({
        message: "Signup Succeeded"
    })
})

adminRouter.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const admin = await adminModel.findOne({
        email: email
    })

    if(!admin) {
        res.status(403).json({
            message: "This Admin does not exist in our Database"
        })
        return
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if(passwordMatch) {
        const token = jwt.sign({
            id: admin._id
        }, JWT_ADMIN_PASSWORD);

        res.json({
            token: token
        })
    } else {
        res.status(403).json({
            message: "incorrect Credentials"
        })
    }

})

adminRouter.post("/course", adminMiddleware, async (req, res) => {
    const adminId = req.userId;

    const { title, description, imageUrl, price} = req.body;

    const course = await courseModel.create({title, description, imageUrl, price, creatorId : adminId})

    res.json({
        message: "Course-Created",
        courseId: course._id
    })

})

adminRouter.put("/course", adminMiddleware, async (req, res) => {
    const adminId = req.userId;

    const { title, description, imageUrl, price} = req.body;

    const course = await courseModel.updateOne({
        _id: courseId,
        creatorId: adminId

    }, {title, description, imageUrl, price})

    res.json({
        message: "Course-Updated",
        courseId: course._id
    })

})

adminRouter.get("/course/bulk", adminMiddleware, async(req, res) => {
    const adminId = req.userId;

    const courses = await courseModel.find({
        creatorId: adminId
    })

    res.json({
        message: "Here are your courses: ",
        courses
    })
})

module.exports = {
    adminRouter: adminRouter
}