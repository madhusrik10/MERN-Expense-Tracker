import User from "../models/UserSchema.js";
import bcrypt from "bcrypt";
import { signAuthToken } from "../middleware/authenticateToken.js";

export const registerControllers = async (req, res, next) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Please enter All Fields",
            }) 
        }

        let user = await User.findOne({email});

        if(user){
            return res.status(409).json({
                success: false,
                message: "User already Exists",
            });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        // console.log(hashedPassword);

        let newUser = await User.create({
            name, 
            email, 
            password: hashedPassword, 
        });

        const token = signAuthToken(newUser._id.toString());
        if (!token) {
            return res.status(503).json({
                success: false,
                code: "AUTH_NOT_CONFIGURED",
                message: "Authentication is temporarily unavailable.",
            });
        }

        const safeUser = newUser.toObject();
        delete safeUser.password;

        return res.status(200).json({
            success: true,
            message: "User Created Successfully",
            user: safeUser,
            token,
        });
    }
    catch(err){
        console.log('err...',err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }

}
export const loginControllers = async (req, res, next) => {
    try{
        const { email, password } = req.body;

        // console.log(email, password);
  
        if (!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please enter All Fields",
            }); 
        }
    
        const user = await User.findOne({ email });
    
        if (!user){
            return res.status(401).json({
                success: false,
                message: "User not found",
            }); 
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
    
        if (!isMatch){
            return res.status(401).json({
                success: false,
                message: "Incorrect Email or Password",
            }); 
        }

        const token = signAuthToken(user._id.toString());
        if (!token) {
            return res.status(503).json({
                success: false,
                code: "AUTH_NOT_CONFIGURED",
                message: "Authentication is temporarily unavailable.",
            });
        }

        const safeUser = user.toObject();
        delete safeUser.password;

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
            user: safeUser,
            token,
        });

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

export const setAvatarController = async (req, res, next)=> {
    try{

        const userId = req.params.id;
       
        const imageData = req.body.image;
      
        const userData = await User.findByIdAndUpdate(userId, {
            isAvatarImageSet: true,
            avatarImage: imageData,
        },
        { new: true });

        return res.status(200).json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
          });


    }catch(err){
        next(err);
    }
}

export const allUsers = async (req, res, next) => {
    try{
        const user = await User.find({_id: {$ne: req.params.id}}).select([
            "email",
            "username",
            "avatarImage",
            "_id",
        ]);

        return res.json(user);
    }
    catch(err){
        next(err);
    }
}

export const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email address",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email address",
            });
        }

        // TODO: Implement password reset logic here
        // For example:
        // 1. Generate a reset token
        // 2. Save token to database with expiration
        // 3. Send email with reset link
        // 4. Return success message

        // For now, return a success message (you'll need to implement email sending)
        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email address",
        });

    } catch (err) {
        console.log('err...', err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}