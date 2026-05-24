import asyncio
from httpx import AsyncClient

async def test_chat():
    async with AsyncClient() as client:
        # Create conv
        print("Creating conv...")
        resp = await client.post("http://localhost:8000/api/conversations/", json={"title": "test"}, headers={"x-user-id": "guest"})
        print(resp.status_code, resp.text)
        if resp.status_code != 200:
            return
        conv_id = resp.json()["id"]

        print(f"Streaming message to conv {conv_id}...")
        async with client.stream("POST", "http://localhost:8000/api/chat/stream", data={
            "conversation_id": conv_id,
            "message": "Merhaba"
        }, headers={"x-user-id": "guest"}) as stream_resp:
            print(stream_resp.status_code)
            async for chunk in stream_resp.aiter_text():
                print(chunk, end="")
            print("\nDone")

if __name__ == "__main__":
    asyncio.run(test_chat())
