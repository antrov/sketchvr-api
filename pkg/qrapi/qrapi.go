package qrapi

import (
	"fmt"
	"net"

	"github.com/skip2/go-qrcode"
)

func outboundIP() (*string, error) {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)
	localIP := localAddr.IP.String()

	return &localIP, nil
}

func PNG(s int) ([]byte, error) {
	ip, err := outboundIP()
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("ws://%s:%s", *ip, "8081")

	png, err := qrcode.Encode(url, qrcode.Medium, s)
	if err != nil {
		return nil, err
	}

	return png, nil
}
