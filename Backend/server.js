require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const app = express();
const port = process.env.PORT || 5000;
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  'https://boisterous-crepe-972e2b.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...envOrigins,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const sanitized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(sanitized)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' })); 


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'SolveAI backend', endpoints: ['/analyze-image'] });
});

app.get('/analyze-image', (_req, res) => {
  res.status(405).json({ error: 'Use POST /analyze-image with JSON { image: dataUrl }' });
});

app.post('/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


    const prompt = `
    You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them.
    Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right).
    For example:
    Q. 2 + 3 * 4
    (3 * 4) => 12, 2 + 12 = 14.
    Q. 2 + 3 + 5 * 4 - 8 / 2
    5 * 4 => 20, 8 / 2 => 4, 2 + 3 => 5, 5 + 20 => 25, 25 - 4 => 21.
    YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME:
    Following are the cases:
    1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF ONE DICT [{'expr': given expression, 'result': calculated answer}].
    2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS, with dict 1 as {'expr': 'x', 'result': 2, 'assign': True} and dict 2 as {'expr': 'y', 'result': 5, 'assign': True}. This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables.
    3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {'assign': True}, keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS.
    4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc. These will have a drawing representing some scenario and accompanying information with the image. PAY CLOSE ATTENTION TO DIFFERENT COLORS FOR THESE PROBLEMS. You need to return the answer in the format of a LIST OF ONE DICT [{'expr': given expression, 'result': calculated answer}].
    5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept.
    Analyze the equation or expression in this image and return the answer according to the given rules:
    Make sure to use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc.
    DO NOT USE BACKTICKS OR MARKDOWN FORMATTING.
    `;


    
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const mimeType = matches[1]; 
    const base64Data = matches[2];

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType, 
      },
    };

    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = await response.text();

    // Parse and format the response for better readability
    let formattedAnalysis = text;
    try {
      // Try to parse as JSON and format nicely
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        formattedAnalysis = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // If not valid JSON, keep original text
      formattedAnalysis = text;
    }

    res.json({ 
      analysis: formattedAnalysis,
      rawResponse: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while analyzing the image', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




