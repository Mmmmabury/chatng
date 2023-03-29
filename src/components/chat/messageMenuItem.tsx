import React from "react";
import { Menu, MenuItemProps } from "antd";

class MessageMenuItem extends React.Component<MenuItemProps> {
    render() {
        const { ...restProps } = this.props;
        return (
            <div> </div>
            // <Menu.Item {...restProps}>
            //   <button>djaofijawo</button>
            // </Menu.Item>
        );
    }
}

export default MessageMenuItem;
