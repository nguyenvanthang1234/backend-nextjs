const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/UserModel");
const Role = require("./models/RoleModel");
const { CONFIG_PERMISSIONS } = require("./configs");

dotenv.config();

const setAdmin = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(`${process.env.MONGO_DB}`);
    console.log("Connected to DB");

    const email = "ThangAdmin@gmail.com";
    
    // 1. Tìm hoặc tạo Role Admin
    let roleAdmin = await Role.findOne({ name: "Admin" });
    if (!roleAdmin) {
        console.log("Admin role not found, creating...");
        roleAdmin = new Role({
            name: "Admin",
            permissions: [CONFIG_PERMISSIONS.ADMIN],
        });
        await roleAdmin.save();
        console.log("Created Admin Role");
    } else {
        console.log("Found Admin Role:", roleAdmin._id);
    }

    // 2. Tìm User và update Role
    const user = await User.findOne({ email });
    if (user) {
      user.role = roleAdmin._id;
      await user.save();
      console.log(`Successfully updated user ${email} to Admin role`);
    } else {
      console.log(`User ${email} not found!`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
};

setAdmin();
