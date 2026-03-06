const fs = require('fs');
const path = './app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
                {/* Auth Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                  {isAuthenticated && _hasHydrated ? (
                    <button 
                      onClick={() => {
                        const role = useAuthStore.getState().user?.role || 'user';
                        if (role === 'admin') window.location.href = '/admin';
                        else if (role === 'hub_manager') window.location.href = '/dashboard/hub';
                        else window.location.href = '/shop';
                      }}
                      className="group relative overflow-hidden rounded-full bg-linear-to-r from-[#D4AF37] to-[#C5A028] px-4 py-2 text-[11px] tracking-[0.18em] text-white shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(212,175,55,0.45)] md:px-6">
                      <span className="relative z-10">DASHBOARD</span>
                      <span className="animate-shimmer-sweep absolute inset-y-0 -left-[150%] w-[70%] bg-linear-to-r from-transparent via-white/40 to-transparent" />
                    </button>
                  ) : (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="relative overflow-hidden rounded-full border border-white/20 px-4 py-2 text-[11px] tracking-[0.18em] text-white/80 transition-all duration-300 hover:border-[#D4AF37]/40 hover:text-white md:px-6">
                            LOGIN
                          </button>
                        </DialogTrigger>
                        <DialogContent className="w-full border-0 bg-transparent p-0 shadow-none sm:max-w-md">
                          <VisuallyHidden>
                            <DialogTitle>Login</DialogTitle>
                          </VisuallyHidden>
                          <div className="glass-oily oil-slick-animated relative overflow-hidden rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.2)]">
                            <LoginForm />
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="group relative overflow-hidden rounded-full bg-linear-to-r from-[#D4AF37] to-[#C5A028] px-4 py-2 text-[11px] tracking-[0.18em] text-white shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all duration-300 hover:shadow-[0_6px_30px_rgba(212,175,55,0.45)] md:px-6">
                            <span className="relative z-10">SIGN UP</span>
                            <span className="animate-shimmer-sweep absolute inset-y-0 -left-[150%] w-[70%] bg-linear-to-r from-transparent via-white/40 to-transparent" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="w-full border-0 bg-transparent p-0 shadow-none sm:max-w-md">
                          <VisuallyHidden>
                            <DialogTitle>Register</DialogTitle>
                          </VisuallyHidden>
                          <div className="glass-oily oil-slick-animated relative overflow-hidden rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.2)]">
                            <RegisterForm />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
`

// extract existing auth actions down to <motion.div
const startStr = "{/* Auth Actions */}";
const endStr = "{/* Gold accent line on scroll */}";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + replacement.trim() + '\n              </div>\n\n              ' + content.substring(endIdx);
  fs.writeFileSync(path, content);
  console.log("Success");
} else {
  console.log("Failed to find boundaries");
}
