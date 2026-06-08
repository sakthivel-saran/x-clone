import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET,{
        expiresIn: "15d"
    });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        samesite : "strict",
        maxAge: 15 * 24 * 60 * 1000 // 15 days
    });
}

export default generateToken;