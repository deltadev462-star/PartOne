
export const protect = async (req, res, next) => {
    try {
        const authData = await req.auth();
        const userId = authData?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Preserve the original auth function and also attach the auth data
        req.authData = authData;
        req.userId = userId;
        
        return next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: error.code || error.message });
    }
};
