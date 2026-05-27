const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The recover.cjs opened <header> but never closed it!
// Let's find where to close <header>. Right where we see the Unexpected closing "div"!
// At line 909, we see `</div></div> <div className="p-4 rounded-xl ...">`
// We need to change one of those `</div>` to `</header>` or insert `</header>`.

// Wait, let's just make it valid:
// The header had `Notification Center Trigger` inside it, and after that trigger, the header closed.
// We can just close the header directly after the Notification Center Trigger!

const replacement = `                    </button>
                  </div>
                </header>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 space-y-3">`;

const brokenStartStr = `                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/10 space-y-3">`;

code = code.replace(brokenStartStr, replacement);


// And we have Unexpected closing "aside" tag does not match opening "div" tag
// We didn't open an <aside>. The <aside> was probably opened in the code we deleted!
// Let's replace </aside> with </div> or delete it if it's redundant.
code = code.replace("            </aside>", "            </div>");
code = code.replace("          </aside>", "          </div>");
code = code.replace("        </aside>", "        </div>");
code = code.replace("      </aside>", "      </div>");


// And `Expected identifier but found "/"` at 13201
// `        </div>`
// Let's find line 13200-13202.
// It's probably because we missed an opening `<div>` or closing `</div>`.
// We added:
//   return (
//     <div className="flex ...
//       <div className="flex-1 ...
//         <div className="h-full px-2 ...

// To fix it correctly, let's just close all the tags appropriately at the end.
const endReplacement = `      </div>
      <footer className="mt-auto border-t`;

code = code.replace(`      </div>
      <footer className="mt-auto border-t`, endReplacement);


fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx tags patched!');
