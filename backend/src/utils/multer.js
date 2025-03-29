import multer from "multer";

export const uploadFile = () => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './public');
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      },
    });
    return upload = multer({ storage: storage});
  }

  