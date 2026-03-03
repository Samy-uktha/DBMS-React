const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address_line,
      city,
      state,
      pincode,
      role,
      blood_group,
      date_of_birth,
      hospital_name,
      license_number
    } = req.body;

    // 1️⃣ Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Insert into users table
    const newUser = await pool.query(
      `INSERT INTO users 
      (name, email, password_hash, phone, address_line, city, state, pincode, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [name, email, hashedPassword, phone, address_line, city, state, pincode, role]
    );

    const userId = newUser.rows[0].id;

    // 4️⃣ If DONOR → insert into donors table
    if (role === "DONOR") {
        if (!blood_group || !date_of_birth) {
          return res.status(400).json({
            message: "Blood group and date of birth are required for donors"
        });
      }
      await pool.query(
        `INSERT INTO donors (user_id, blood_group, date_of_birth)
         VALUES ($1,$2,$3)`,
        [userId, blood_group, date_of_birth]
      );
    }

    // 5️⃣ If HOSPITAL → insert into hospitals table
    if (role === "HOSPITAL") {
      if (!hospital_name) {
    return res.status(400).json({
      message: "Hospital name is required"
    });
  }
      await pool.query(
        `INSERT INTO hospitals (user_id, hospital_name, license_number)
         VALUES ($1,$2,$3)`,
        [userId, hospital_name, license_number]
      );
    }

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // 2️⃣ Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};