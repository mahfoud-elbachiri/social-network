package utils

import (
	"path/filepath"
)

func GetImageBasePath() string {
	
	return "../frontend/public"
}

func GetImageSavePath(subfolder string) string {
	basePath := GetImageBasePath()
	return filepath.Join(basePath, subfolder)
}
