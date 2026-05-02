"""
MOCK face recognition service.
To use AWS Rekognition: replace match_faces() with real API call.
Interface stays identical — zero changes needed in routes.
"""
import random
import uuid
import asyncio


async def match_faces(selfie_bytes: bytes, event_id: str) -> list[dict]:
    """
    Mock: returns random photo IDs with confidence scores.
    Real: call AWS Rekognition SearchFacesByImage here.
    """
    await asyncio.sleep(0.5)  # simulate processing time
    mock_count = random.randint(8, 20)
    return [
        {
            "photo_id": str(uuid.uuid4()),
            "confidence": round(random.uniform(0.65, 0.97), 2),
        }
        for _ in range(mock_count)
    ]

# To switch to AWS Rekognition, replace above with:
# import boto3
# client = boto3.client('rekognition', region_name='us-east-1')
# response = client.search_faces_by_image(
#     CollectionId=f"event-{event_id}",
#     Image={'Bytes': selfie_bytes},
#     MaxFaces=50,
#     FaceMatchThreshold=60
# )
# return [{"photo_id": m['Face']['ExternalImageId'],
#           "confidence": m['Similarity'] / 100}
#         for m in response['FaceMatches']]
