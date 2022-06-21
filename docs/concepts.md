# Thredz concepts
* The most important concept in Threz is that Thredz is Layer 2 state and computation.
* Thredz persists state and execution in a metanet graph structure.
* Thredz strives to allow for a provider model. Schema, storage format, computation model ought to be swappable or pluggable.

## Thredz computation model
State and threads of execution

## Versioning
Thredz leverages the versioning of nodes that metanet allows

## Bcat on metanet
Logically, at times, we wish to handle a group of nodes as a logical single unit.
Splitting a file into chunks with bcat is such a case. Other use cases exist.
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```