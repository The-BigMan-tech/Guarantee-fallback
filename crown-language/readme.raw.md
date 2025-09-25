### Welcome To Crown 👑
It is a lightweight,expressive and declarative knowledge representation language inspired from Prolog.


### Applications of the language
- Scalable knowledge representation.
- Expert systems.
- Problem solving.


### Difference between it and Prolog 
- It does'nt use an interpreter but rather,it uses a resolver which is a component that converts the declarative document to a json file which is machine readable.This means that syntax overhead only happens once and queries work directly on the json document.

- It has a declarative logic document language solely for declaring facts but requires the use of its imperative api through language bindings in a host language for writing rules and making queries.

- It focuses more on knowledge representation than symbolic reasoning
  

### Why learn or use it ?
- It does'nt branch away from the foundational principles of prolog.
- It is easy to read and write.
- It's syntax is very flexible yet safe for scale.
- It has integration potential with any imperative language.
- It allows domain experts to document their facts separately and in parallel to those who will write the inferences.


### But why the design choice ?
- By using a resolver over an interpreter :
    
    - There is zero overhead of syntax interpretation during querying or making inferences.
  
    - Collaboration is faster as team members dont have to resolve the document on their own end to query.The lean json document can be shared along with the src and it can be queried on immediately.
    
    - It can also enforce more semantic safety through static analysis that wont be possible if interpreted because of the dynamic nature of interpretation.This can make it written at scale with no safety costs.

- The main reason for having rules and queries in an imperative language instead of directly in the declarative document like in prolog was:

    - For clean separation of concerns where the facts of the knowledge base are written declaratively while the rules are written imperatively to control exactly how the inference is made.
  
    - To make the rules less ambiguous and highly explicit.No complex unification or backtracking under the hood.It's executed as it is written and it is easier to debug.It also increases adoption because it prevents the extra step of learning a new language's constructs just to use it.But it also s that it may not be eaily accessible to non programmers without some coding knowledge.
    
    - It prevents accidents in queries by leveraging the host language's type system.
  

### Important note
As of now,only a javascript binding is available.You are free to port the binding to your target language and share it with the community.


### Environment Setup
- To use this language,you must install nodeJS because the language is written in javascript.It requires at least v22 because it was the version that was used to write the language.

- Install the language with npm or pnpm and make sure that you do so as a global installation.
  
  ```shell
    npm install -g @crown
  ```

- After installing the language,open a terminal and run the following command which will run the language as a long lived program.
  ```shell
      crown run
  ```

- It is recommended that you use this language in vscode and install the crown language extension for editor support.It makes constant requests to the language so it's expected that you always have the language running on a terminal as a long lived program.Else,the extension will crash and may require a restart.
 
- Create and open a file ending with .crown to start editing it.
  
- Install the javascript binding; crown-js in a separate npm project to write rules and make queries.
  

### An Overview of the Concepts
**Facts :** They are declarative statements that describes what is true.They are an explicit relationship between objects, and properties these objects might have.They are unconditionally true.

**Rules :** These are instructions that infer what is true even though it is'nt explicitly written.

**Queries :** They are questions on the relationships between objects and their properties

**Knowledge base :** A collection of facts and rules as a whole.


### WalkThrough 
#### Syntax and Semantics
- Syntax notation
- Quick intro to errors
- Facts
- Expected output
- Json output structure
- Names
- Name usage assertion
- Numbers
- Predicates
- Aliases
- Comments
- Fillers
- Arrays
- References
- Concatenation
- Errors in detail


#### The rule-based model
- Brief introduction
- Queries
- Types of truthiness check (exact match or membership)
- Query types (statement vs implication)
- Rules
- Wild card candidate vs Arbitrary candidate


#### Others
- Incremental resolution
- How to contribute to the language
  

### Facts
Facts are written with a single relationship(predicate or alias) with one to many names or numbers and it ends with a terminator.

#### Examples:

```crown
:Billy is a *boy.
:Mandy is a *girl.
:Wally is a *teacher.
```

Here,Billy,Mandy and Wally are the objects and boy,girl and teacher are the relationships.These facts state what is true about the different people.These few examples dont fully capture the syntax so we must walkthrough the data types in order to effectively write in it.


### Names
These are the objects we are talking about and want to relate with in a sentence.It is mostly for nouns but can also be used as modifiers like adjectives and adverbs.They are denoted by words prefixed with a colon **':'**. Examples are :plane, :sword, :umbrella, :Nicole,etc.


### Name usage assertion
Names are usually prefixed with colons but one can also prefix it with an exclamation mark **'!'**.Writing names with this prefix instead is name usage assertion.What it does is that it tells the resolver that the name has been used before(with the colon prefix)

```crown
:k is *big.
!k is *n.
```

### How to contribute to the language
One can contribute by implementing and sharing their reasoning models with the community with well exposed interfaces for usability.

Can new language features be proposed?
Yes,but the language is mainly for knowledge representation