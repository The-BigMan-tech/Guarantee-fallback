### Welcome To Crown
It is a lightweight,expressive and declarative logic language inspired from Prolog.


### Applications of the language
- Scalable knowledge representation
- Expert systems 
- Problem solving


You can skip the following secctions straight to environment setup.

### Difference between it and Prolog 
- It does'nt use an interpreter but rather,it uses a resolver which is a component that converts the declarative document to a json file which is machine readable.This means that syntax overhead only happens once where subsequent queries work directly on the json document.

- It has a declarative logic document language solely for declaring facts but requires the use of its imperative api through language bindings in a host language for writing rules and making queries.


### Why learn or use it ?
- It does'nt branch away from the foundational principles of prolog.
- It is easy to read and write.
- It's syntax is very flexible yet safe for scale.
- It has integration potential with any imperative language.
- Despite the imperative rule centric design,it allows domain experts to document their facts separately and in parallel to those who will write the inferences.


### But why the design choice ?
- By using a resolver over an interpreter :
    
    - There is zero overhead of syntax interpretation during querying.It also allows for faster collaboration as team members dont have to resolve the document on their own end to query it.One can just directly send the lean json document and it can be queried on immediately.
    
    - It can also enforce more semantic safety through static analysis that wont be possible if interpreted because of the dynamic nature of interpretation.This can make it written at scale with no safety costs.

- The main reason for having rules and queries in an imperative language instead of directly in the declarative document like in prolog was:

    - For clean separation of concerns where the facts of the knowledge base are written declaratively while the rules are written imperatively to control exactly how the inference is made.
  
    - To make the rules less ambiguous and highly explicit.No complex unification or backtracking under the hood.It's executed as it is written and it is easier to debug.It also increases adoption because it prevents the extra step of learning a new language's constructs just to use it.But it does also mean that it may not be eaily accessible to non programmers without some coding knowledge.
    

### Important note
Since the language uses an ipc-server architecture,it means that integration with any imperative language is just to port the lightweight binding which is a client written in a specific language to interop its host with the logic language without having to port the entire codebase to each language.This increases integration capabilities but as of now,only a javascript binding is available.You are free to port the binding to your target language and share it with the community.


### Environment Setup
- To use this language,you must install nodeJS because the language is written in javascript.This is for cross compatibility across machines by just installing the nodeJS runtime.It requires at least v22 because it was the version that was used during the time of writing the language.

- After installing the language,open a terminal and run:
```shell
    crown run
```
This will run the language as a long lived program through an ipc server.

- Install the javascript binding; crown js in a separate npm project to write rules and make queries.
  
- It is encouraged for you to use this language in vscode as it has editor support through the crown language extension.It makes constant requests to the language so it's expected that you always have the language running on a terminal as a long lived program.Else,the extension will crahs and may require a restart.


### Basics
Facts: They are eclarative statements that describes what is true.They are an explicit relationship between objects, and properties these objects might have.They are unconditionally true.

Rules: These are instructions that infer what is true even though it is'nt explicitly written.

Queries: They are questions on the relationships between objects and their properties

Knowledge base: A collection of facts and rules as a whole.


### Table of Contents
- Facts
- Names
- Numbers
- Predicates
- Aliases
- Fillers
- Arrays
- Comments
- Semanti