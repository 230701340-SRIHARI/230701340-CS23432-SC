const { connect } = require('getstream');
const bcrypt = require('bcrypt');
const { StreamChat } = require('stream-chat');
const crypto = require('crypto');
require('dotenv').config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

// Helper: Validate phone number
const isValidPhoneNumber = (number) => {
    const regex = /^\d{11,}$/; // only digits, at least 11 numbers
    return regex.test(number);
};

const signup = async (req, res) => {
    try {
        const { fullName, username, password, phoneNumber, avatarURL } = req.body;

        // Phone number validation
        if (!isValidPhoneNumber(phoneNumber)) {
            return res.status(400).json({
                message: 'Invalid phone number. It must contain only digits and be at least 11 characters long.',
            });
        }

        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        // Check for existing username or phone number
        const { users } = await client.queryUsers({
            $or: [{ name: username }, { phoneNumber }],
        });

        if (users.length > 0) {
            const isUsernameTaken = users.some((user) => user.name === username);
            const isPhoneTaken = users.some((user) => user.phoneNumber === phoneNumber);

            return res.status(400).json({
                message: isUsernameTaken
                    ? 'Username already exists'
                    : 'Phone number already registered',
            });
        }

        const userId = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = serverClient.createUserToken(userId);

        // Create user
        await client.upsertUser({
            id: userId,
            name: username,
            fullName,
            hashedPassword,
            phoneNumber,
            avatarURL,
        });

        res.status(200).json({
            token,
            fullName,
            username,
            userId,
            hashedPassword,
            phoneNumber,
            avatarURL,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Signup failed. Please try again.' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const serverClient = connect(api_key, api_secret, app_id);
        const client = StreamChat.getInstance(api_key, api_secret);

        const { users } = await client.queryUsers({ name: username });

        if (!users.length) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = users[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = serverClient.createUserToken(user.id);

        res.status(200).json({
            token,
            fullName: user.fullName,
            username,
            userId: user.id,
            avatarURL: user.avatarURL,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
};

module.exports = { signup, login };
