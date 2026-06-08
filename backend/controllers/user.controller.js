import Notification from "../models/notification.model.js";
import User from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary.js";
export const getProfile = async (req, res) => {
    try {
        const {username} = req.params;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json( user );
    } catch (error) {
        console.log(`Error in getProfile: ${error}`);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const followUnFollowUser = async (req, res) => {
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You cannot follow/unfollow yourself" });
        }

        if(!userToModify || !currentUser){
            return res.status(404).json({error :"user not found"})
        }

        const isFollowing = currentUser.following.includes(id);

        if(isFollowing){
            //unfollow
            await User.findByIdAndUpdate({_id:id}, {$pull:{followers : req.user._id}})
            await User.findByIdAndUpdate({_id : req.user._id}, {$pull:{following :id}})
            res.status(200).json({message : "unfollow successfully"})


            
        }
        else{
            //follow
            await User.findByIdAndUpdate({_id:id}, {$push:{followers: req.user._id}})
            await User.findByIdAndUpdate({_id : req.user._id}, {$push:{following :id}})
            //send notification
            const newNotification = new Notification({
                from: req.user._id,
                to: userToModify._id,
                type: "follow"
            });
            await newNotification.save();
            res.status(200).json({message : "follow successfully"})

        }

    } catch (error) {
        console.log(`Error in followUnFollowUser: ${error}`);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const userFollowedByMe = await User.findById({_id:userId}).select("-password")
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId }
            }
        },{
            $sample: { 
                size: 10
            }
        }
        ]) 

        const filteredUser = users.filter((user) => !userFollowedByMe.following.includes(user._id))
        const suggestedUsers = filteredUser.slice(0,4);
        suggestedUsers.forEach((user) => (user.password = null))
        res.status(200).json(suggestedUsers);
    } catch (error){
        console.log(`Error in getSuggestedUsers: ${error}`);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const updateUser = async (req, res) => {
	try {
		const userId = req.user._id;

		const {
			username,
			fullname,
			email,
			currentPassword,
			newPassword,
			bio,
			link,
		} = req.body;

		let { profilePicture, coverImg } = req.body;

		let user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		// PASSWORD CHANGE

		if (
			(!currentPassword && newPassword) ||
			(currentPassword && !newPassword)
		) {
			return res.status(400).json({
				error: "Please provide both current and new password",
			});
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(
				currentPassword,
				user.password
			);

			if (!isMatch) {
				return res.status(400).json({
					error: "Current password is incorrect",
				});
			}

			if (newPassword.length < 6) {
				return res.status(400).json({
					error: "Password must be at least 6 chars",
				});
			}

			const salt = await bcrypt.genSalt(10);

			user.password = await bcrypt.hash(
				newPassword,
				salt
			);
		}

		// PROFILE IMAGE

		if (profilePicture) {
			if (user.profilePicture) {
				try {
					await cloudinary.uploader.destroy(
						user.profilePicture
							.split("/")
							.pop()
							.split(".")[0]
					);
				} catch {}
			}

			const uploadedProfile =
				await cloudinary.uploader.upload(
					profilePicture
				);

			user.profilePicture =
				uploadedProfile.secure_url;
		}

		// COVER IMAGE

		if (coverImg) {
			if (user.coverImg) {
				try {
					await cloudinary.uploader.destroy(
						user.coverImg
							.split("/")
							.pop()
							.split(".")[0]
					);
				} catch {}
			}

			const uploadedCover =
				await cloudinary.uploader.upload(
					coverImg
				);

			user.coverImg =
				uploadedCover.secure_url;
		}

		// OTHER FIELDS

		user.fullname = fullname || user.fullname;
		user.username = username || user.username;
		user.email = email || user.email;
		user.bio = bio || user.bio;
		user.link = link || user.link;

		await user.save();

		user.password = null;

		return res.status(200).json(user);

	} catch (error) {
		console.log(
			`Error in updateUser : ${error}`
		);

		res.status(500).json({
			error: "Internal server error",
		});
	}
};