package utils

type Postes struct {
	ID         int
	UserID     int
	Username   string
	UserAvatar string // User's profile avatar
	Title      string
	Content    string
	CreatedAt  string
	Nembre     int
	Have       string
	Avatar     string // Post image (optional)
	Privacy    string
}

type UserProfile struct {
	ID        int    `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Gender    string `json:"gender"`
	Age       int    `json:"age"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	AboutMe   string `json:"about_me"`
	IsPrivate bool   `json:"is_private"`
}

type Comment struct {
	Content string `json:"content"`
	PostID  string `json:"post_id"`
}

type CommentPost struct {
	ID        int
	PostID    int
	UserID    int
	Content   string
	CreatedAt string
	Username  string
	Have      string
}

type Jsncomment struct {
	ID string `json:"post_id"`
}

var (
	LastId = 0
	Poste  []Postes
)

type Msg struct {
	Sender   string
	Receiver string
	Text     string
	Time     string
}
