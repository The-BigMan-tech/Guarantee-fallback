<h3>Welcome To Crown 👑</h3>
<p>It is a lightweight,expressive and declarative knowledge representation language inspired from Prolog.</p>
<h3>Applications of the language</h3>
<ul>
<li>Scalable knowledge representation.</li>
<li>Expert systems.</li>
<li>Problem solving.</li>
</ul>
<h3>Difference between it and Prolog</h3>
<ul>
<li>
<p>It does'nt use an interpreter but rather,it uses a resolver which is a component that converts the declarative document to a json file which is machine readable.This means that syntax overhead only happens once and queries work directly on the json document.</p>
</li>
<li>
<p>It has a declarative logic document language solely for declaring facts but requires the use of its imperative api through language bindings in a host language for writing rules and making queries.</p>
</li>
<li>
<p>It focuses more on knowledge representation than symbolic reasoning</p>
</li>
</ul>
<h3>Why learn or use it ?</h3>
<ul>
<li>It does'nt branch away from the foundational principles of prolog.</li>
<li>It is easy to read and write.</li>
<li>It's syntax is very flexible yet safe for scale.</li>
<li>It has integration potential with any imperative language.</li>
<li>It allows domain experts to document their facts separately and in parallel to those who will write the inferences.</li>
</ul>
<h3>But why the design choice ?</h3>
<ul>
<li>
<p>By using a resolver over an interpreter :</p>
<ul>
<li>
<p>There is zero overhead of syntax interpretation during querying or making inferences.</p>
</li>
<li>
<p>Collaboration is faster as team members dont have to resolve the document on their own end to query.The lean json document can be shared along with the src and it can be queried on immediately.</p>
</li>
<li>
<p>It can also enforce more semantic safety through static analysis that wont be possible if interpreted because of the dynamic nature of interpretation.This can make it written at scale with no safety costs.</p>
</li>
</ul>
</li>
<li>
<p>The main reason for having rules and queries in an imperative language instead of directly in the declarative document like in prolog was:</p>
<ul>
<li>
<p>For clean separation of concerns where the facts of the knowledge base are written declaratively while the rules are written imperatively to control exactly how the inference is made.</p>
</li>
<li>
<p>To make the rules less ambiguous and highly explicit.No complex unification or backtracking under the hood.It's executed as it is written and it is easier to debug.It also increases adoption because it prevents the extra step of learning a new language's constructs just to use it.But it also s that it may not be eaily accessible to non programmers without some coding knowledge.</p>
</li>
<li>
<p>It prevents accidents in queries by leveraging the host language's type system.</p>
</li>
</ul>
</li>
</ul>
<h3>Important note</h3>
<p>As of now,only a javascript binding is available.You are free to port the binding to your target language and share it with the community.</p>
<h3>Environment Setup</h3>
<ul>
<li>
<p>To use this language,you must install nodeJS because the language is written in javascript.It requires at least v22 because it was the version that was used to write the language.</p>
</li>
<li>
<p>Install the language with npm or pnpm and make sure that you do so as a global installation.</p>
<pre><code>  npm install -g @crown
</code></pre>
</li>
<li>
<p>After installing the language,open a terminal and run the following command which will run the language as a long lived program.</p>
<pre><code>    crown run
</code></pre>
</li>
<li>
<p>It is recommended that you use this language in vscode and install the crown language extension for editor support.It makes constant requests to the language so it's expected that you always have the language running on a terminal as a long lived program.Else,the extension will crash and may require a restart.</p>
</li>
<li>
<p>Create and open a file ending with .crown to start editing it.</p>
</li>
<li>
<p>Install the javascript binding; crown-js in a separate npm project to write rules and make queries.</p>
</li>
</ul>
<h3>An Overview of the Concepts</h3>
<p><strong>Facts :</strong> They are declarative statements that describes what is true.They are an explicit relationship between objects, and properties these objects might have.They are unconditionally true.</p>
<p><strong>Rules :</strong> These are instructions that infer what is true even though it is'nt explicitly written.</p>
<p><strong>Queries :</strong> They are questions on the relationships between objects and their properties</p>
<p><strong>Knowledge base :</strong> A collection of facts and rules as a whole.</p>
<h3>WalkThrough</h3>
<ul>
<li>Syntax notation</li>
<li>Quick intro to errors</li>
<li>Facts</li>
<li>Expected output</li>
<li>Names</li>
<li>Name usage assertion</li>
<li>Numbers</li>
<li>Predicates</li>
<li>Aliases</li>
<li>Comments</li>
<li>Fillers</li>
<li>Arrays</li>
<li>References</li>
<li>Concatenation</li>
<li>Errors in detail</li>
<li>Queries</li>
<li>Types of truthiness check (exact match or membership)</li>
<li>Query types (statement vs implication)</li>
<li>Rules</li>
<li>Wild card candidate vs Arbitrary candidate</li>
<li>Incremental resolution</li>
</ul>
<h3>Facts</h3>
<p>Facts are written with a single relationship(predicate or alias) with one to many names or numbers and it ends with a terminator.</p>
<h4>Examples:</h4>
<pre class="shiki crown-theme" style="background-color:#222222;color:#ffffff" tabindex="0"><code><span class="line"><span style="color:#A6F5D1">:Billy</span><span style="color:#FFFFFF"> is a </span><span style="color:#F0BE8A">*boy</span><span style="color:#E78181">.</span></span>
<span class="line"><span style="color:#A6F5D1">:Mandy</span><span style="color:#FFFFFF"> is a </span><span style="color:#F0BE8A">*girl</span><span style="color:#E78181">.</span></span>
<span class="line"><span style="color:#A6F5D1">:Wally</span><span style="color:#FFFFFF"> is a </span><span style="color:#F0BE8A">*teacher</span><span style="color:#E78181">.</span></span>
<span class="line"></span></code></pre>
<p>Here,Billy,Mandy and Wally are the objects and boy,girl and teacher are the relationships.These facts state what is true about the different people.These few examples dont fully capture the syntax so we must walkthrough the data types in order to effectively write in it.</p>
<h3>Names</h3>
<p>These are the objects we are talking about and want to relate with in a sentence.It is mostly for nouns but can also be used as modifiers like adjectives and adverbs.They are denoted by words prefixed with a colon <strong>':'</strong>. Examples are :plane, :sword, :umbrella, :Nicole,etc.</p>
<h3>Name usage assertion</h3>
<p>Names are usually prefixed with colons but one can also prefix it with an exclamation mark <strong>'!'</strong>.Writing names with this prefix instead is name usage assertion.What it does is that it tells the resolver that the name has been used before(with the colon prefix)</p>
<pre class="shiki crown-theme" style="background-color:#222222;color:#ffffff" tabindex="0"><code><span class="line"><span style="color:#A6F5D1">:k</span><span style="color:#FFFFFF"> is </span><span style="color:#F0BE8A">*big</span><span style="color:#E78181">.</span></span>
<span class="line"><span style="color:#F1A671">!k</span><span style="color:#FFFFFF"> is </span><span style="color:#F0BE8A">*n</span><span style="color:#E78181">.</span></span>
<span class="line"></span></code></pre>
