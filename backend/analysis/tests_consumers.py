from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from analysis.consumers import PoseConsumer
from analysis.routing import websocket_urlpatterns
# NOTE: To test channels properly, we usually need routing setup. 
# Since we are unit testing the consumer class directly or via communicator, 
# we can wrap it effectively.

class PoseConsumerTests(TransactionTestCase):
    async def test_pose_consumer_connection(self):
        communicator = WebsocketCommunicator(PoseConsumer.as_asgi(), "/ws/analysis/pose/")
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_pose_consumer_receive_and_broadcast(self):
        communicator = WebsocketCommunicator(PoseConsumer.as_asgi(), "/ws/analysis/pose/")
        await communicator.connect()

        # Send data matching the expected structure
        test_data = {
            "landmarks": [1, 2, 3], 
            "timestamp": 123456
        }
        await communicator.send_json_to(test_data)

        # The consumer broadcasts to group 'pose_data'.
        # However, the generic PoseConsumer.receive() in the provided code 
        # actually DOES NOT send a message back to the sender by default 
        # UNLESS the sender is part of the group and loopback happens, 
        # OR if there's explicit send logic.
        
        # Looking at consumers.py:
        # receive() -> sends to group 'pose_data' with type 'pose_update'
        # pose_update() -> sends back to client.
        
        # Since the communicator acts as the client connected to this consumer instance,
        # and connect() adds this channel to 'pose_data', 
        # we SHOULD receive the broadcast back.
        
        response = await communicator.receive_json_from()
        self.assertEqual(response, test_data)

        await communicator.disconnect()
