import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PoseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join specific group if needed, or just broadcast
        self.room_name = "unreal_stream"
        self.room_group_name = "pose_data"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Frontend)
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            # data should contain: {"landmarks": [...], "timestamp": ...}
            
            # Broadcast to Unreal (or any other listener in the group)
            # In a real scenario, Unreal might connect to a generic TCP socket, 
            # but if using WebSockets in Unreal, it can subscribe to this same group.
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'pose_update',
                    'data': data
                }
            )
        except Exception:
            # Ignore malformed payloads to keep stream alive.
            return

    async def pose_update(self, event):
        """
        Handler for group messages of type 'pose_update'.
        This forwards the received pose payload back to connected clients.
        """
        await self.send(text_data=json.dumps(event.get('data', {})))

    # Handler for group messages
    async def analysis_complete(self, event):
        # Forward analysis completion data (feedback URLs) to client
        await self.send(text_data=json.dumps(event.get('data', {})))
