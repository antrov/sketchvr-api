package cast

import (
	"encoding/json"
	"log"
)

type EventType int

type TextPayload string

const (
	connected EventType = iota
	disconnected
	message
)

type PayloadData struct {
	Type TextPayload `json:"type"`
}

type EventMessage struct {
	Type    int
	Payload []byte
}

type Event struct {
	Type    EventType
	Sender  interface{}
	Message *EventMessage
}

type Broadcaster struct {
	evtChan chan *Event
	handler HandlerFunc
	clients []interface{}
}

type HandlerFunc func(interface{}, *EventMessage)

// Start Broadcaster goroutine
// Make possible to send and receive events
func (b *Broadcaster) Start() {
	go func() {
		for {
			select {
			case evt := <-b.evtChan:
				switch evt.Type {
				case connected:
					log.Printf("connected")
					b.clients = append(b.clients, evt.Sender)

				case disconnected:
					log.Printf("disconnected")
					for i, c := range b.clients {
						if c == evt.Sender {
							b.clients[i] = b.clients[len(b.clients)-1]
							b.clients = b.clients[:len(b.clients)-1]
							break
						}
					}

				case message:
					log.Printf("message type %d\n", evt.Message.Type)

					for _, c := range b.clients {
						if c == evt.Sender {
							continue
						}
						b.handler(c, evt.Message)
					}
				}
			}
		}
	}()
}

// Post message from particular sender, with specified message type and messages bytes
// Message will be brodcasted to all registered clients except sender
func (b Broadcaster) Post(sender interface{}, mt int, msg []byte) {
	b.evtChan <- &Event{
		Type:   message,
		Sender: sender,
		Message: &EventMessage{
			Type:    mt,
			Payload: msg,
		},
	}
}

// Cast message to absolutely all registered clients
func (b Broadcaster) Cast(msg TextPayload) {
	json, err := json.Marshal(PayloadData{
		Type: msg,
	})
	if err != nil {
		log.Fatal((err))
	}

	b.Post(nil, 1, json)
}

// AddClient to broadcast messages to him
func (b Broadcaster) AddClient(c interface{}) {
	b.evtChan <- &Event{
		Type:   connected,
		Sender: c,
	}
}

// DelClient when it is disconnected and to prevent routing to it messages
func (b Broadcaster) DelClient(c interface{}) {
	b.evtChan <- &Event{
		Type:   disconnected,
		Sender: c,
	}
}

// New Broadcaster
// Broadcaster to start send and receive data has to be started
func New(handler HandlerFunc) *Broadcaster {
	return &Broadcaster{
		evtChan: make(chan *Event),
		handler: handler,
	}
}
