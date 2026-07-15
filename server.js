// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// IN-MEMORY DATABASE (With Mock Seed Data)
// ==========================================
let users = [
    { id: 1, name: "Alice Smith", email: "alice@example.com", role: "customer" },
    { id: 2, name: "Chef Priya", email: "priya@example.com", role: "cook" },
    { id: 3, name: "System Admin", email: "admin@example.com", role: "admin" }
];

let cooks = [
    { 
        id: 1, 
        userId: 2, 
        kitchenName: "Priya's Homely Kitchen", 
        cuisine: "North Indian", 
        rating: 4.8, 
        deliveryRadius: "5 km", 
        isApproved: true,
        address: "42 Park Street, Area 1"
    },
    { 
        id: 2, 
        userId: 4, 
        kitchenName: "Auntie's Southern Flavors", 
        cuisine: "South Indian", 
        rating: 4.9, 
        deliveryRadius: "3 km", 
        isApproved: false, // Pending Admin Approval
        address: "12 Temple Rd, Area 2"
    }
];

let menus = [
    { id: 101, cookId: 1, dishName: "Standard Veg Thali", type: "Veg", priceDaily: 120, priceWeekly: 800, priceMonthly: 3000, description: "3 Rotis, Rice, Dal, Seasonal Sabzi, Salad", available: true },
    { id: 102, cookId: 1, dishName: "Premium Chicken Thali", type: "Non-Veg", priceDaily: 160, priceWeekly: 1100, priceMonthly: 4200, description: "3 Rotis, Rice, Butter Chicken, Dal, Raita", available: true },
    { id: 103, cookId: 2, dishName: "Classic Idli & Sambar Plan", type: "Veg", priceDaily: 80, priceWeekly: 500, priceMonthly: 1800, description: "4 Soft Idlis, Sambar, Coconut & Tomato Chutney", available: true }
];

let subscriptions = [
    { id: 501, userId: 1, cookId: 1, dishId: 101, planType: "Weekly", status: "Active", startDate: "2026-07-10" }
];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. DISCOVERY / PUBLIC API
app.get('/api/cooks', (req, res) => {
    // Only return approved cooks to customers
    res.json(cooks.filter(c => c.isApproved));
});

app.get('/api/menus', (req, res) => {
    res.json(menus);
});

// 2. CUSTOMER ENDPOINTS
app.post('/api/subscriptions', (req, res) => {
    const { userId, cookId, dishId, planType } = req.body;
    if (!userId || !cookId || !dishId || !planType) {
        return res.status(400).json({ error: "Missing required booking details." });
    }
    const newSub = {
        id: subscriptions.length + 501,
        userId: parseInt(userId),
        cookId: parseInt(cookId),
        dishId: parseInt(dishId),
        planType,
        status: "Pending Cook Approval",
        startDate: new Date().toISOString().split('T')[0]
    };
    subscriptions.push(newSub);
    res.status(201).json(newSub);
});

app.get('/api/subscriptions/user/:userId', (req, res) => {
    const userSubs = subscriptions.filter(s => s.userId == req.params.userId);
    // Enrich sub data with cook and menu names
    const enriched = userSubs.map(s => {
        const cook = cooks.find(c => c.id === s.cookId);
        const dish = menus.find(m => m.id === s.dishId);
        return {
            ...s,
            kitchenName: cook ? cook.kitchenName : "Unknown Kitchen",
            dishName: dish ? dish.dishName : "Unknown Dish"
        };
    });
    res.json(enriched);
});

// 3. COOK ENDPOINTS
app.get('/api/cooks/profile/:userId', (req, res) => {
    const cook = cooks.find(c => c.userId == req.params.userId);
    if (!cook) return res.status(404).json({ error: "Cook profile not found" });
    res.json(cook);
});

app.get('/api/subscriptions/cook/:cookId', (req, res) => {
    const cookSubs = subscriptions.filter(s => s.cookId == req.params.cookId);
    const enriched = cookSubs.map(s => {
        const user = users.find(u => u.id === s.userId);
        const dish = menus.find(m => m.id === s.dishId);
        return {
            ...s,
            customerName: user ? user.name : "Anonymous User",
            dishName: dish ? dish.dishName : "Unknown Dish"
        };
    });
    res.json(enriched);
});

app.put('/api/subscriptions/:id/status', (req, res) => {
    const { status } = req.body;
    const sub = subscriptions.find(s => s.id == req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    sub.status = status;
    res.json({ message: "Subscription status updated", subscription: sub });
});

app.post('/api/menus', (req, res) => {
    const { cookId, dishName, type, priceDaily, priceWeekly, priceMonthly, description } = req.body;
    const newDish = {
        id: menus.length + 101,
        cookId: parseInt(cookId),
        dishName,
        type,
        priceDaily: parseFloat(priceDaily),
        priceWeekly: parseFloat(priceWeekly),
        priceMonthly: parseFloat(priceMonthly),
        description,
        available: true
    };
    menus.push(newDish);
    res.status(201).json(newDish);
});

// 4. ADMIN ENDPOINTS
app.get('/api/admin/pending-cooks', (req, res) => {
    res.json(cooks.filter(c => !c.isApproved));
});

app.put('/api/admin/approve-cook/:id', (req, res) => {
    const cook = cooks.find(c => c.id == req.params.id);
    if (!cook) return res.status(404).json({ error: "Cook profile not found" });
    cook.isApproved = true;
    res.json({ message: "Cook approved successfully!", cook });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 HomeFeast Server running at http://localhost:${PORT}`);
});