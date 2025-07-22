import mongoose from "mongoose";

const contactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Contact person name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  title: {
    type: String,
    required: [true, "Contact person title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  institutionalEmail: {
    type: String,
    required: [true, "Institutional email is required"],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    maxlength: [100, "Email cannot exceed 100 characters"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    match: [
      /^\+?[1-9]\d{1,14}$/,
      "Please enter a valid phone number (E.164 format)",
    ],
    maxlength: [20, "Phone number cannot exceed 20 characters"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
    maxlength: [200, "Address cannot exceed 200 characters"],
  },
});

const aauContactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Contact person name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"],
  },
  college: {
    type: String,
    required: [true, "College is required"],
    enum: [
      "All Colleges",
      "Central",
      "College of Business and Economics (CBE)",
      "College of Social Sciences, Arts and Humanities (CSSAH)",
      "College of Education and Language Studies (CELS)",
      "College of Veterinary Medicine & Agriculture (CVMA)",
      "College of Technology & Built Environment (CoTBE)",
      "College of Natural and Computational Sciences (CNCS)",
      "College of Health Sciences (CHS)",
      "School of Law (SoL)",
      "Institute of Water Environment & Climate Research (IWECR)",
      "Aklilu Lema Institute of Health Research (ALIHR)",
      "Institute of Geophysics Space Science & Astronomy (IGSSA)",
      "Institute for Social & Economic Research (ISER)",
      "Institute of Ethiopian Studies (IES)",
      "Institute of Advanced Science & Technology (IAST)",
      "Institute of Peace & Security (IPSS)",
    ],
  },
  schoolDepartmentUnit: {
    type: String,
    required: [true, "School or department unit is required"],
    trim: true,
    maxlength: [100, "Department name cannot exceed 100 characters"],
  },
  institutionalEmail: {
    type: String,
    required: [true, "Institutional email is required"],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    maxlength: [100, "Email cannot exceed 100 characters"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    match: [
      /^\+?[1-9]\d{1,14}$/,
      "Please enter a valid phone number (E.164 format)",
    ],
    maxlength: [20, "Phone number cannot exceed 20 characters"],
  },
});

const partnershipSchema = new mongoose.Schema(
  {
    partnerInstitution: {
      name: {
        type: String,
        required: [true, "Partner institution name is required"],
        trim: true,
        maxlength: [200, "Institution name cannot exceed 200 characters"],
      },
      address: {
        type: String,
        required: [true, "Partner institution address is required"],
        trim: true,
        maxlength: [200, "Address cannot exceed 200 characters"],
      },
      country: {
        type: String,
        required: [true, "Partner institution country is required"],
        trim: true,
        maxlength: [100, "Country name cannot exceed 100 characters"],
      },
      typeOfOrganization: {
        type: String,
        required: [true, "Type of organization is required"],
        enum: [
          "Academic",
          "Research",
          "NGO",
          "INGO",
          "Government",
          "Private",
          "Other",
        ],
      },
    },
    aauContact: {
      interestedCollegeOrDepartment: {
        type: String,
        required: [true, "Interested college or department is required"],
        trim: true,
        maxlength: [100, "Department name cannot exceed 100 characters"],
      },
    },
    potentialAreasOfCollaboration: {
      type: [String],
    },
    otherCollaborationArea: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    potentialStartDate: {
      type: Date,
      required: [true, "Potential start date is required"],
    },
    durationOfPartnership: {
      type: String,
      required: [true, "Duration of partnership is required"],
      enum: ["1 year", "2 years", "3 years", "4 years", "5 years"],
    },
    deliverables: {
      type: [String],
      required: false,
    },
    fundingAmount: {
      type: Number,
      required: [true, "Funding amount is required"],
    },
    reportingRequirements: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "Reporting requirements cannot exceed 500 characters"],
    },
    partnerContactPerson: {
      type: contactPersonSchema,
      required: true,
    },
    partnerContactPersonSecondary: {
      type: contactPersonSchema,
      required: false,
    },
    aauContactPerson: {
      type: aauContactPersonSchema,
      required: true,
    },
    aauContactPersonSecondary: {
      type: aauContactPersonSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Active", "Rejected"],
      default: "Pending",
    },
    campusId: {
      type: String,
      required: [true, "Campus ID is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    mouFileUrl: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    scope: {
      type: String,
      required: false,
      trim: true,
      maxlength: [2000, "Scope cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add indexes for better query performance
partnershipSchema.index({ campusId: 1 });
partnershipSchema.index({ status: 1 });
partnershipSchema.index({ "partnerInstitution.name": "text" });

// Add virtual for expiration date
partnershipSchema.virtual("expirationDate").get(function () {
  const durationYears = parseInt(this.durationOfPartnership);
  const expiration = new Date(this.potentialStartDate);
  expiration.setFullYear(expiration.getFullYear() + durationYears);
  return expiration;
});

export default mongoose.model("Partnership", partnershipSchema);
