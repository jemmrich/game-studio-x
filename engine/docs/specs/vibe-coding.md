# Vibe Coding Use & Standards

## What to use and when

#### Claude Sonnet 4.5 (full price)
- Great for thorough well thought-out implementation
- Requires some hand holding but in a good way
- Can produce a lot of documentation

#### Claude Haiku 4.5 (cheaper)
- When you want a Claude Sonnet experience for 1/3 the price
- Great for small implementations, documentation, debugging

#### Grok Code Fast (cheapest)
- Great for quick implementation, minimal hand holding and can be a little over zealous compared to what you ask (doing more than intended)
- Great for debugging which could become repetitive and burn through tokens

## GitHub Copilot Models
The free models provided by GitHub identify themselves as GitHub Copilot powered by X.

For models that require advanced tokens, those are propritary and do not consider themselves and GitHub Copilot.

## Model Instructions
GitHub Copilot models will reference `model-instructions.md` similar to `claude.md`.

For Copilot, these files can be placed in the `.github` folder, the root of your project folder, or a subfolder.

Lastly, GitHub Copilot PR Reviews can also make use of these files.

## AI Model Reference

### Grok Code Fast (free with GitHub Copilot)
The Grok Code Fast 1 model is a specialized, high-speed AI model developed by xAI specifically for agentic coding workflows. It excels at common coding tasks like debugging, editing, and generating code, prioritizing speed and cost-efficiency over general-purpose reasoning. 


| Feature | Description |
|---------|-------------|
|Speed and Efficiency   |   The model is highly optimized for low latency, delivering responses at up to 92 tokens per second, making it one of the fastest coding assistants available. This speed is designed to help developers stay in a "flow state" without waiting for long AI responses. |
| Agentic Coding |   It is built for autonomous coding tasks where the AI plans and executes multi-step instructions (e.g., searching a codebase, editing files, running tests) with minimal human oversight.   |
| Large Context Window  |   It features a substantial 256,000-token context window, allowing it to process and reason across entire codebases or extensive documentation in a single pass, which is a significant advantage for large projects. |
| Transparent Reasoning |   A unique feature is its ability to expose its "reasoning traces," allowing developers to see the model's thought process. This enhances trust and helps developers audit AI decisions and refine prompts. |
| Cost-Effective    |   Utilizing a Mixture-of-Experts (MoE) architecture, the model is designed to be highly economical for high-volume use cases, offering a competitive pricing structure compared to larger, general-purpose models. |

### Claude Sonnet 4.5 (1x with GitHub Copilot)
If you are going to use Claude Sonnet, this is the latest and greatest to use.

| Feature | Description |
|---------|-------------|
| Performance & Intelligence    |   Improved performance in coding and complex reasoning tasks. |
| Task Reliability  |   More "locked in" for long-term projects; sticks to multi-step plans. |
| Coding	|	Higher coding accuracy (e.g., SWE-bench score increase). |
| User Experience & Design	|   More nuanced design, better use of whitespace, and refined typography hierarchy. |
| Professional Deliverables |   Excels at creating professional-quality documents, spreadsheets with working formulas, and presentations. |
| Safety & Security |   Stronger prompt-injection and misuse defenses due to higher safety alignment (ASL-3). |

### Claude Haiku 4.5 (0.33x with GitHub Copilot)
Claude Haiku 4.5 is Anthropic's small, fast, and cost-efficient AI model, designed for high-throughput tasks like chatbots and coding assistance. It delivers near-frontier performance for many tasks, including coding and computer use, at a significantly lower cost and higher speed than larger models like Claude Sonnet. Haiku 4.5 supports both text and image inputs and is available via API and on cloud platforms like Amazon Bedrock and Google Cloud's Vertex AI. 

| Feature | Description |
|---------|-------------|
| Speed and cost  |    It is Anthropic's fastest and most cost-efficient model, priced at $1 per 1 million input tokens and $5 per 1 million output tokens. | 
| Performance   |   It achieves near-frontier coding and reasoning performance, with results that are comparable to larger models in many practical scenarios. | 
| Task suitability    |   Ideal for real-time applications, customer service bots, research triage, and multi-agent systems where speed and cost are critical. | 
| Computer use    |   Offers significant performance improvements for computer use tasks, where it can interact with software like a human. | 
| Context window  |   Supports a 200,000-token context window for standard users, with developers having access to a 1-million-token context window. | 
| Input support   |   Accepts both text and image inputs. | 
| Safety  |   Classified under Anthropic's AI Safety Level 2 (ASL-2), a less restrictive classification than the ASL-3 given to its larger models. | 

### Rapter Mini (free with GitHub Copilot)
Raptor Mini is a fast, fine-tuned version of OpenAI's GPT-5 Mini model, optimized for speed in common coding tasks like inline suggestions and code generation within development environments like GitHub Copilot. It prioritizes quick and accurate responses over complex reasoning, making it ideal for "grunt work" such as finding and replacing code instances or updating imports across multiple files rapidly. 

| Feature | Description |
|---------|-------------|
|Speed|Raptor Mini is designed for speed, providing instant inline code suggestions and explanations. |
| Focus |   It excels at common, lower-complexity coding tasks where speed is more critical than profound reasoning. |
| Performance   |   It is a fine-tuned model based on GPT-5 Mini, offering strong performance for a wide range of coding and writing tasks. |
| Use Case  |   It is particularly useful for tasks like "find and replace" across many files, updating imports, and fixing tests, often completing them in seconds. |
| Comparison    |   It is not a replacement for more powerful models like GPT-5 but is a specialized tool for fast-paced development work. |
| Availability  |   As of late 2025, it was in preview with gradual rollout and not yet available for all business and enterprise plans. |


### GPT-4.1 (free with GitHub Copilot)
GPT-4.1 is a large language model from OpenAI that offers improved reasoning, faster speed, and enhanced reliability over previous models. Key features include a massive \(1\) million token context window, making it suitable for processing large documents and codebases, and superior performance in coding and following complex instructions. It's available in a family of models, including GPT-4.1, GPT-4.1-mini, and GPT-4.1-nano, each with different trade-offs in performance and cost. 

#### Key improvements
GPT-4.1 is designed to be faster and more reliable, with a significant focus on improving coding ability and instruction-following. It has a massive \(1\) million token context window, allowing it to process and understand very long texts at once.Performance: It shows strong performance in complex reasoning, coding tasks like the SWE-bench benchmark, and factuality.Model family: The GPT-4.1 series includes three main models:GPT-4.1: The flagship model, offering the highest reasoning and accuracy.GPT-4.1-mini: A model with balanced reasoning and accuracy for a cost-efficient option.GPT-4.1-nano: The smallest, fastest, and most affordable model in the family.Availability: It is a proprietary model developed by OpenAI and is accessible through platforms like the OpenAI API.Knowledge cutoff: The model was trained on data up to June 2024. 

### GPT-4o (free with GitHub Copilot)
GPT-4o is OpenAI's flagship multimodal AI model, capable of processing and generating outputs across text, audio, and vision in real time. The "o" in its name stands for "omni," signifying its ability to handle multiple modalities in a single system. This allows for more natural human-computer interactions, such as responding to audio inputs with speeds similar to human reaction time and understanding nuances in voice and vision. 


| Feature | Description |
|---------|-------------|
| Multimodality   |   GPT-4o can understand and produce combinations of text, audio, and images. For example, it can take an image and a text prompt as input and provide a text or image output. |
| Speed and efficiency    |   It is faster than previous models like GPT-4 Turbo and is also more cost-efficient for API users. |
| Real-time interaction   |   It can respond to audio inputs in milliseconds, enabling more fluid conversations, and can even be interrupted while speaking. |
| Improved language and vision  |   GPT-4o shows significantly better performance on non-English languages and enhanced understanding of vision and audio compared to its predecessors. |
| Accessibility   |   OpenAI made GPT-4o capabilities available to free-tier users on ChatGPT, unlike the previous GPT-4, to make advanced AI more accessible. | 

### GPT-5 mini (free with GitHub Copilot)
GPT-5 mini is a faster, more cost-efficient version of OpenAI's GPT-5 large language model, designed for well-defined tasks. It offers a balance between speed, cost, and capability, and is one of three GPT-5 variants, alongside the full model and the smaller, faster gpt-5-nano

#### What it is
- A variant of GPT-5: It is a smaller, mid-tier version of the larger, more powerful GPT-5 model.
- Cost-optimized: It is designed to be cheaper to use than the full GPT-5 model, with pricing based on tokens.
- For specific tasks: It is best suited for precise, well-defined prompts and tasks that require an optimal balance of speed and cost. 

#### How it compares to other models
- vs. GPT-5: The full GPT-5 model offers the highest performance and is suitable for complex reasoning, while GPT-5 mini is a more economical choice for less demanding tasks.
- vs. GPT-5 nano: GPT-5 nano is the smallest and most cost-efficient model, with limited reasoning capabilities, making GPT-5 mini the middle option in terms of capability and cost.
- vs. other models like GPT-4.1: For applications that require very fast, live responses, a different model like GPT-4.1 may be more suitable. GPT-5 and its variants are for when you need more advanced reasoning or performance where waiting a few seconds is acceptable. 

