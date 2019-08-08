new Vue({
    el: "#app",

    data: {
        ws: null,
        newMsg: "",
        chatContent: "",
        username: null,
        joined: false,
        userList: [],
        canvas: null,
        context: null,
        isDrawing: false,
        startX: 0,
        startY: 0,
        points: []
    },
    created: function() {
        var self = this;
        this.ws = new WebSocket("ws://" + window.location.host + "/ws");
        this.ws.addEventListener("message", function(e) {
            var msg = JSON.parse(e.data);
            if (msg.message) {
                self.chatContent +=
                    '<p class="m-0">' +
                    msg.username +
                    " : " +
                    msg.message +
                    "<p>";
            }
            for (var i = 0; i < msg.points.length; i++) {
                let j = i + 1;
                var s = msg.points[i];
                var next = msg.points[j];
                self.context.beginPath();
                self.context.moveTo(s.x, s.y);
                self.context.lineWidth = 1;
                self.context.lineCap = "round";
                self.context.strokeStyle = "rgba(0,0,0,1)";
                self.context.lineTo(next.x, next.y);
                self.context.stroke();
            }
            self.points = [];
        });
    },
    updated: function() {
        var element = document.getElementById("chat-messages");
        element.scrollTop = element.scrollHeight;
    },
    mounted: function() {
        var self = this;
        self.canvas = self.$refs.canvas;
        self.context = self.canvas.getContext("2d");
        self.canvas.addEventListener("mousedown", self.mousedown);
        self.canvas.addEventListener("mousemove", self.mousemove);
        document.addEventListener("mouseup", self.mouseup);
    },
    methods: {
        send: function() {
            let nicknameCmd = this.newMsg.split(" ")[0];
            let newNick = this.newMsg.split(" ")[1];
            if (nicknameCmd == "/nickname") {
                this.username = newNick;
                this.newMsg = "";
                return;
            }
            if (this.newMsg != "") {
                this.ws.send(
                    JSON.stringify({
                        username: this.username,
                        message: $("<p>")
                            .html(this.newMsg)
                            .text()
                    })
                );
                this.newMsg = "";
            }
        },
        join: function() {
            this.username = $("<p>")
                .html(this.username)
                .text();
            this.joined = true;
        },
        mousedown(e) {
            var self = this;
            var rect = self.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            self.isDrawing = true;
            self.startX = x;
            self.startY = y;
            self.points.push({
                x: x,
                y: y
            });
        },
        mousemove(e) {
            var self = this;
            var rect = self.canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;

            if (self.isDrawing) {
                self.context.beginPath();
                self.context.moveTo(self.startX, self.startY);
                self.context.lineTo(x, y);
                self.context.lineWidth = 1;
                self.context.lineCap = "round";
                self.context.strokeStyle = "rgba(0,0,0,1)";
                self.context.stroke();

                self.startX = x;
                self.startY = y;

                self.points.push({
                    x: x,
                    y: y
                });
            }
        },
        mouseup(e) {
            var self = this;
            self.isDrawing = false;
            if (self.points.length > 0) {
                this.ws.send(JSON.stringify({ points: self.points }));
            }
            self.points = [];
        },
        resetCanvas() {
            var self = this;
            self.canvas.width = self.canvas.width;
            self.points.length = 0;
        }
    }
});
