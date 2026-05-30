from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.database import get_db
from app.models import User
from app.config import settings
import uuid

router = APIRouter()

@router.post("/create-checkout")
async def create_checkout(user_id: str, user_email: str):
    try:
        import stripe
        stripe.api_key = settings.stripe_secret_key
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": settings.stripe_pro_price_id, "quantity": 1}],
            success_url="http://localhost:5173/dashboard?upgraded=true",
            cancel_url="http://localhost:5173/pricing",
            customer_email=user_email,
            metadata={"user_id": user_id}
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        import stripe
        payload = await request.body()
        sig = request.headers.get("stripe-signature", "")
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
        if event["type"] == "checkout.session.completed":
            user_id = event["data"]["object"]["metadata"].get("user_id")
            if user_id:
                await db.execute(
                    update(User).where(User.id == uuid.UUID(user_id)).values(plan="pro")
                )
                await db.commit()
        return {"received": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))