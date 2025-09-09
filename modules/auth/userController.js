import User from "#modules/auth/user.model.js";


/**
 * Update User Details (e.g., name)
 */
const updateUser = async (req, reply) => {
  const userId = req.user.id; // Assuming authentication middleware sets req.user

  const { name, email, phone } = req.body; // Add other user-related fields as needed

  // Define allowed fields for update
  const allowedUpdates = {};

  if (name !== undefined) allowedUpdates.name = name;
  if (phone !== undefined) allowedUpdates.phone = phone;
  // Add other user-related fields here

  // If no valid fields are provided for update, respond with an error
  if (Object.keys(allowedUpdates).length === 0) {
    return reply.code(400).send({ message: "No valid fields provided for update." });
  }

  // Fetch the user from the database
  const user = await User.findById(userId);

  if (!user) {
    return reply.code(404).send({ message: "User not found." });
  }

  // Apply updates to the user object
  for (const key in allowedUpdates) {
    user[key] = allowedUpdates[key];
  }

  // Save the updated user to the database
  await user.save();

  // Prepare the user object for the response by removing sensitive fields
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.resetPasswordToken;
  delete userResponse.resetPasswordExpires;

  // Send the response
  return reply.send({ message: "User updated successfully." });
};



const getUserByToken = async (req, reply) => {
  let user = req.user;
  if (!user.roles.includes('admin')) {
    user.organization = undefined;
  }
  return reply.send(user);
};

export { updateUser, getUserByToken };
