package utils

import (
	"io"
	"mime/multipart"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// hash password
func HashPassword(password string) (string, error) {
	result, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(result), nil
}

// compare password and hashed password
func ComparePassAndHashedPass(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

// IsValidImage checks if the uploaded file is a valid image (jpeg or png)
func IsValidImage(file multipart.File) (bool, string) {
	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil {
		return false, "Failed to read file"
	}

	// Reset file pointer after reading
	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return false, "Failed to reset file pointer"
	}

	contentType := http.DetectContentType(buffer)

	switch contentType {
	case "image/jpeg", "image/jpg", "image/png","image/gif":
		return true, ""
	default:
		return false, "Invalid file type. Only JPEG and PNG are allowed."
	}
}
