package mail

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
)

type SMTPClient struct {
	domain   string
	port     string
	email    string
	password string
}

func NewSMTPClient(domain, port, email, password string) *SMTPClient {
	return &SMTPClient{
		domain:   domain,
		port:     port,
		email:    email,
		password: password,
	}
}

func (s *SMTPClient) SendVerificationCode(to string, code int) error {
	tmpl := template.Must(template.ParseFiles("internal/mail/templates/verification.tmpl"))

	data := struct {
		Code int
	}{
		Code: code,
	}

	buf := new(bytes.Buffer)
	if err := tmpl.Execute(buf, data); err != nil {
		return err
	}

	auth := smtp.PlainAuth("", s.email, s.password, s.domain)
	subject := "Subject: Верифікаційний код\r\n"
	contentType := "Content-Type: text/html; charset=UTF-8\r\n"
	msg := []byte(fmt.Sprintf("To: %s\r\n%s%s\r\n%s", to, subject, contentType, buf.String()))

	err := smtp.SendMail(s.domain+":"+s.port, auth, s.email, []string{to}, msg)
	if err != nil {
		log.Print(err)
		return err
	}

	log.Print("Email успішно надіслано: ", to)
	return nil
}

func (s *SMTPClient) SendResetPassword(to string, link string) error {
	tmpl := template.Must(template.ParseFiles("internal/mail/templates/reset.tmpl"))

	data := struct {
		Link string
	}{
		Link: link,
	}

	buf := new(bytes.Buffer)
	if err := tmpl.Execute(buf, data); err != nil {
		return err
	}

	auth := smtp.PlainAuth("", s.email, s.password, s.domain)
	subject := "Subject: Скидання пароля\r\n"
	contentType := "Content-Type: text/html; charset=UTF-8\r\n"
	msg := []byte(fmt.Sprintf("To: %s\r\n%s%s\r\n%s", to, subject, contentType, buf.String()))

	err := smtp.SendMail(s.domain+":"+s.port, auth, s.email, []string{to}, msg)
	if err != nil {
		log.Print(err)
		return err
	}

	log.Print("Email успішно надіслано: ", to)
	return nil
}
