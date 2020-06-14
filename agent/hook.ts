import { colors as c } from "../lib/color";
import { ArrayMap, JavaClass, Throwable } from "../lib/type";
export namespace hooking {
    export function hook_class_methods(clazz: string, trace_flag: boolean) {
        let clazzInstance = Java.use(clazz);
        const throwable: Throwable = Java.use("java.lang.Throwable");
        const uniqueMethods: string[] = clazzInstance.class.getDeclaredMethods().map((method : any) => {
            // perform a cleanup of the method. An example after toGenericString() would be:
            // public void android.widget.ScrollView.draw(android.graphics.Canvas) throws Exception
            // public final rx.c.b<java.lang.Throwable> com.apple.android.music.icloud.a.a(rx.c.b<java.lang.Throwable>)
                let m: string = method.toGenericString();
            // Remove generics from the method
            while (m.includes("<")) { m = m.replace(/<.*?>/g, ""); }
    
            // remove any "Throws" the method may have
            if (m.indexOf(" throws ") !== -1) { m = m.substring(0, m.indexOf(" throws ")); }
    
            // remove scope and return type declarations (aka: first two words)
            // remove the class name
            // remove the signature and return
            m = m.slice(m.lastIndexOf(" "));
            m = m.replace(` ${clazz}.`, "");
    
            return m.split("(")[0];
    
          }).filter((value:any, index:any, self:any) => {
            return self.indexOf(value) === index;
          });
    
        uniqueMethods.forEach((method) => {
          clazzInstance[method].overloads.forEach((m: any) => {
            // get the argument types for this overload
            const calleeArgTypes: string[] = m.argumentTypes.map((arg:any) => arg.className);
            console.log(`Hooking ${c.green(clazz)}.${c.greenBright(method)}(${c.red(calleeArgTypes.join(", "))})`);
    
            // replace the implementation of this method
            // tslint:disable-next-line:only-arrow-functions
            m.implementation = function() {
              console.log(
                `Called ${c.green(clazz)}.${c.greenBright(m.methodName)}(${c.red(calleeArgTypes.join(", "))})`,
              );
              // if (trace_flag) {
              //   console.log("\t" + throwable.$new().getStackTrace().map((trace_element:any) => trace_element.toString() + "\n\t").join(""))
              // }
              let ts = new Date().getTime();
              let report : any= {};
              report['timestamp'] = ts;
              report['callee'] = clazz + '.' + m.methodName;
              report['argTypes'] = calleeArgTypes.join(", ")
              if (trace_flag) {
                report['backtrace'] = throwable.$new().getStackTrace().map((trace_element:any) => trace_element.toString() + "\n\t").join("")
              }
              send(JSON.stringify(report, null));
              // actually run the intended method
              return m.apply(this, arguments);
            };
          });
        });
    }

    export function hook_target_methods(clazz: string, method_name: string, trace_flag: boolean, arg_val: boolean) {
      let clazzInstance = Java.use(clazz);
        const throwable: Throwable = Java.use("java.lang.Throwable");
        const uniqueMethods: string[] = clazzInstance.class.getDeclaredMethods().map((method : any) => {
            let m: string = method.toGenericString();
            while (m.includes("<")) { m = m.replace(/<.*?>/g, ""); }
            if (m.indexOf(" throws ") !== -1) { m = m.substring(0, m.indexOf(" throws ")); }
            m = m.slice(m.lastIndexOf(" "));
            m = m.replace(` ${clazz}.`, "");
            return m.split("(")[0];
          }).filter((value:any, index:any, self:any) => {
            return self.indexOf(value) === index;
          });
    
        uniqueMethods.forEach((method) => {
          if (method == method_name) {
            clazzInstance[method].overloads.forEach((m: any) => {
              // get the argument types for this overload
              const calleeArgTypes: string[] = m.argumentTypes.map((arg:any) => arg.className);
              console.log(`Hooking ${c.green(clazz)}.${c.greenBright(method)}(${c.red(calleeArgTypes.join(", "))})`);
              m.implementation = function() {
                console.log(
                  `Called ${c.green(clazz)}.${c.greenBright(m.methodName)}(${c.red(calleeArgTypes.join(", "))})`,
                );
                let ts = new Date().getTime();
                let report : any= {};
                report['callee'] = clazz + '.' + m.methodName;
                report['argTypes'] = calleeArgTypes.join(", ")
                if (trace_flag) {
                  report['backtrace'] = throwable.$new().getStackTrace().map((trace_element:any) => trace_element.toString() + "\n\t").join("")
                }
                if (arg_val) {
                  report['arg_val'] = arguments
                }
                send(JSON.stringify(report, null));
                // actually run the intended method
                return m.apply(this, arguments);
              };
            });
          }
          
        });
    }
}