const mongoose = require("mongoose");
const Address = require("../models/address.model");


const {
  validateFullName,
  validatePhone,
  validateOptionalEmail,
  validateRequiredText,
  validatePostalCode,
} = require("../validators/address.validator");


// --------------------------------
// Add Address
// --------------------------------

const addAddress = async (req, res) => {
  try {

    const {
      fullName,
      phone,
      email,
      country,
      state,
      city,
      postalCode,
      addressLine1,
      addressLine2,
      landmark,
      addressType,
    } = req.body;

    // --------------------------------
// Full Name Validation
// --------------------------------

const fullNameError = validateFullName(fullName);

if (fullNameError) {
  return res.status(400).json({
    success: false,
    message: fullNameError,
  });
}

// --------------------------------
// Phone Validation
// --------------------------------

const phoneError = validatePhone(phone);

if (phoneError) {
  return res.status(400).json({
    success: false,
    message: phoneError,
  });
}

const emailError = validateOptionalEmail(email);

if (emailError) {
  return res.status(400).json({
    success: false,
    message: emailError,
  });
}

// --------------------------------
// Country Validation
// --------------------------------

const countryError = validateRequiredText(country, "Country");

if (countryError) {
  return res.status(400).json({
    success: false,
    message: countryError,
  });
}

const stateError = validateRequiredText(state, "State");

if (stateError) {
  return res.status(400).json({
    success: false,
    message: stateError,
  });
}

const cityError = validateRequiredText(city, "City");

if (cityError) {
  return res.status(400).json({
    success: false,
    message: cityError,
  });
}

const postalCodeError = validatePostalCode(postalCode);

if (postalCodeError) {
  return res.status(400).json({
    success: false,
    message: postalCodeError,
  });
}
const addressError = validateRequiredText(
  addressLine1,
  "Address Line 1"
);

if (addressError) {
  return res.status(400).json({
    success: false,
    message: addressError,
  });
}
// --------------------------------
// Check Existing Addresses
// --------------------------------

const addressCount = await Address.countDocuments({
  customer: req.user._id,
});

const isDefault = addressCount === 0;

// --------------------------------
// Create Address
// --------------------------------

const address = await Address.create({
  customer: req.user._id,

  fullName: fullName.trim(),
  phone: phone.trim(),
  email: email ? email.trim().toLowerCase() : "",

  country: country.trim(),
  state: state.trim(),
  city: city.trim(),
  postalCode: postalCode.trim(),

  addressLine1: addressLine1.trim(),
  addressLine2: addressLine2 ? addressLine2.trim() : "",
  landmark: landmark ? landmark.trim() : "",

  label: label || "Home",

  isDefault,
});

res.status(201).json({
  success: true,
  message: "Address added successfully.",
  address,
});



  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Get All Addresses
// --------------------------------

const getAddresses = async (req, res) => {
  try {

    const addresses = await Address.find({
      customer: req.user._id,
       isActive: true,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Get Single Address
// --------------------------------

const getSingleAddress = async (req, res) => {
  try {

    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    res.status(200).json({
      success: true,
      address,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Update Address
// --------------------------------

const updateAddress = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      fullName,
      phone,
      email,
      country,
      state,
      city,
      postalCode,
      addressLine1,
      addressLine2,
      landmark,
      label,
    } = req.body;

    // --------------------------------
    // Validate ObjectId
    // --------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID.",
      });
    }

    // --------------------------------
    // Find Address
    // --------------------------------

    const address = await Address.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }
    // --------------------------------
// Full Name Validation
// --------------------------------

if (fullName !== undefined) {

  const fullNameError = validateFullName(fullName);

  if (fullNameError) {
    return res.status(400).json({
      success: false,
      message: fullNameError,
    });
  }

  address.fullName = fullName.trim();
}
// --------------------------------
// Phone Validation
// --------------------------------

if (phone !== undefined) {

  const phoneError = validatePhone(phone);

  if (phoneError) {
    return res.status(400).json({
      success: false,
      message: phoneError,
    });
  }

  address.phone = phone.trim();
}
// --------------------------------
// Email Validation
// --------------------------------

if (email !== undefined) {

  const emailError = validateOptionalEmail(email);

  if (emailError) {
    return res.status(400).json({
      success: false,
      message: emailError,
    });
  }

  address.email = email
    ? email.trim().toLowerCase()
    : "";
}
if (country !== undefined) {

  const countryError = validateRequiredText(
    country,
    "Country"
  );

  if (countryError) {
    return res.status(400).json({
      success: false,
      message: countryError,
    });
  }

  address.country = country.trim();
}
if (state !== undefined) {

  const stateError = validateRequiredText(
    state,
    "State"
  );

  if (stateError) {
    return res.status(400).json({
      success: false,
      message: stateError,
    });
  }

  address.state = state.trim();
}

if (city !== undefined) {

  const cityError = validateRequiredText(
    city,
    "City"
  );

  if (cityError) {
    return res.status(400).json({
      success: false,
      message: cityError,
    });
  }

  address.city = city.trim();
}

if (postalCode !== undefined) {

  const postalCodeError =
    validatePostalCode(postalCode);

  if (postalCodeError) {
    return res.status(400).json({
      success: false,
      message: postalCodeError,
    });
  }

  address.postalCode = postalCode.trim();
}

if (addressLine1 !== undefined) {

  const addressError = validateRequiredText(
    addressLine1,
    "Address Line 1"
  );

  if (addressError) {
    return res.status(400).json({
      success: false,
      message: addressError,
    });
  }

  address.addressLine1 = addressLine1.trim();
}

if (addressLine2 !== undefined) {
  address.addressLine2 = addressLine2.trim();
}

if (landmark !== undefined) {
  address.landmark = landmark.trim();
}

if (label !== undefined) {

  const labelError = validateLabel(label);

  if (labelError) {
    return res.status(400).json({
      success: false,
      message: labelError,
    });
  }

  address.label = label;
}
// --------------------------------
// Save Updated Address
// --------------------------------

await address.save();


// --------------------------------
// Success Response
// --------------------------------

res.status(200).json({
  success: true,
  message: "Address updated successfully.",
  address,
});


  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Delete Address
// --------------------------------

const deleteAddress = async (req, res) => {
  try {

    const { id } = req.params;

    // --------------------------------
    // Validate ObjectId
    // --------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID.",
      });
    }

    // --------------------------------
    // Find Address
    // --------------------------------

    const address = await Address.findOne({
      _id: id,
      customer: req.user._id,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }
    // --------------------------------
// Soft Delete Address
// --------------------------------

const wasDefault = address.isDefault;

address.isActive = false;
address.isDefault = false;

await address.save();

// --------------------------------
// Assign New Default Address
// --------------------------------

if (address.isDefault) {

  const nextDefaultAddress = await Address.findOne({
    customer: req.user._id,
    isActive: true,
    _id: { $ne: address._id },
  }).sort({
    createdAt: 1,
  });

  if (nextDefaultAddress) {

    nextDefaultAddress.isDefault = true;

    await nextDefaultAddress.save();
  }

}
// --------------------------------
// Success Response
// --------------------------------

return res.status(200).json({
  success: true,
  message: "Address deleted successfully.",
});

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



module.exports = {
  addAddress,
  getAddresses,
  getSingleAddress,
  updateAddress,
  deleteAddress

};