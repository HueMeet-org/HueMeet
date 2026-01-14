# HueMeet

<div align="center" id="introlix">

**Exchange skills with professionals. Find someone who has what you want to learn and wants what you can teach. Free peer-to-peer learning.**

</div>

---

## Overview

Let’s be real, despite being more connected than ever, finding the right person to build something with is still incredibly hard. Whether you’re a student looking for a study partner or a developer searching for a project teammate, you usually end up lost in cluttered Discord servers or scrolling through dead Reddit threads.

That’s exactly why we’re building HueMeet.

HueMeet is a place where finding your people doesn’t feel like a struggle. It’s built for students, builders, and creators who want to skip the awkward small talk and jump straight into meaningful collaboration. Our goal is simple: help you connect with people who are genuinely excited about the same ideas or technologies as you, and give you the tools, like live calls and screen sharing, to start building together right away.

---

## How It Works

1. Discover people who match your interests

   On the Discover page, you’ll find recommended users based on shared interests. You can view full profiles including bio, projects, social links, GitHub (for developers), and their Aura score. If someone feels like a good fit, you can send them a connection request.

2. Review and accept connection requests

   All incoming requests appear on the Requests page. You can explore the sender’s profile in detail and decide whether their goals and vision align with yours before accepting.

3. Collaborate, learn, and grow together

   Once connected, you can message each other, hop on live calls, share screens, and work together whether as study buddies or project teammates.

4. Aura: reputation that grows with you

   Your Aura increases as you make meaningful connections, spend time on the platform, collaborate through calls, and actively engage with others. It reflects how positive and involved you are within the HueMeet community.

5. Keeping the community safe

   HueMeet has clear community rules to ensure a respectful environment. If a user sends inappropriate or abusive messages, those messages won’t be delivered and their Aura will decrease. Repeated violations can lead to warnings and, eventually, account suspension.

   Machine learning models help monitor chats and voice interactions to keep the platform safe and welcoming for everyone.

6. Privacy-first by design

   All chats are end-to-end encrypted. Messages are briefly checked by automated safety systems before delivery to prevent rule violations, and are not stored or used to train any models. Once a message is sent, it is not reviewed again.

   The same principle applies to voice calls. While calls can’t be blocked instantly, repeated violations trigger warnings, automatically end the call, reduce Aura, and may result in suspension if the behavior continues.

---

## Tech Stack

1. Frontend: NextJs/React, Tailwind, shadcn(optional)
2. Backend Solution: Supabase for auth, connection, chat, call
3. Backend: Fastapi (for aura, and ml and other apis)
4. AI/ML: DeBERTa-v3 (Multi-task learning for toxicity & emotion classification) using PyTorch & HuggingFace.
5. DevOps: GitHub Actions for CI/CD, Docker for ML Microservices.
6. Realtime media (call): Under progress.

---
## Roadmap
### Phase 1: Core System
- Auth System: SignUp with Google, Github and Email
- User Profile: Every Details of Users
- Discover Page: For showing users with same interests to connect
- Connection Logic: Implementation of the "Request-Accept" handshake flow.

### Phase 2: Realtime Collaboration Layer
- Messaging System: End-to-end encrypted chat with real-time presence indicators.
- Voice Call: Same experience as discord with screen sharing

### Phase 3: The AI & "Aura" Ecosystem

---
## UI/UX Details
- Home Page: Shows user details like aura and some quick button to message or call connected person. Some recommendation of users to connect.
- Discover Page
- Profile Page
- Messages Page
- Requests Page